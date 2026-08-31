package app.vercel.traco_pi.twa.widget;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.widget.RemoteViews;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

import app.vercel.traco_pi.twa.R;

/**
 * The traco home-screen widget.
 *
 * It reads /api/widget/summary with a bearer token the user pasted when adding
 * the widget. That endpoint already returns preformatted display strings, so
 * nothing here knows about currencies or the rollover rules — if the budgeting
 * logic changes on the web side, the widget follows for free.
 *
 * Written in Java, not Kotlin, because Bubblewrap generates a Java-only Gradle
 * project and regenerates build.gradle on update — a Kotlin plugin added here
 * would be silently reverted the next time the wrapper is refreshed.
 */
public class TracoWidgetProvider extends AppWidgetProvider {

    private static final String PREFS = "traco_widget";
    private static final String KEY_TOKEN = "token";

    public static final String ACTION_REFRESH = "app.vercel.traco_pi.twa.widget.REFRESH";

    /** Must match the deployed site; a token is only valid against it. */
    private static final String BASE_URL = "https://traco-pi.vercel.app";

    private static final int TIMEOUT_MS = 10000;

    static String tokenFor(Context context, int widgetId) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .getString(KEY_TOKEN + "." + widgetId, null);
    }

    static void saveToken(Context context, int widgetId, String token) {
        SharedPreferences.Editor editor =
                context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit();
        editor.putString(KEY_TOKEN + "." + widgetId, token);
        editor.apply();
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        // A BroadcastReceiver is killed as soon as onReceive returns, so the
        // network call has to hold the process open explicitly.
        final PendingResult pending = goAsync();
        new Thread(() -> {
            try {
                for (int id : ids) {
                    render(context, manager, id);
                }
            } finally {
                pending.finish();
            }
        }).start();
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (ACTION_REFRESH.equals(intent.getAction())) {
            AppWidgetManager manager = AppWidgetManager.getInstance(context);
            int[] ids = manager.getAppWidgetIds(
                    new ComponentName(context, TracoWidgetProvider.class));
            onUpdate(context, manager, ids);
        }
    }

    @Override
    public void onDeleted(Context context, int[] ids) {
        SharedPreferences.Editor editor =
                context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit();
        for (int id : ids) {
            editor.remove(KEY_TOKEN + "." + id);
        }
        editor.apply();
    }

    private void render(Context context, AppWidgetManager manager, int widgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_traco);

        // Tapping the body refreshes; tapping "+ Log" deep-links into the app.
        views.setOnClickPendingIntent(R.id.widget_root, refreshIntent(context));
        views.setOnClickPendingIntent(R.id.widget_add, openIntent(context, "/dashboard?log=1"));

        String token = tokenFor(context, widgetId);
        if (token == null) {
            views.setTextViewText(R.id.widget_headline, "Not set up");
            views.setTextViewText(R.id.widget_sub, "Remove and re-add to enter a token");
            manager.updateAppWidget(widgetId, views);
            return;
        }

        try {
            JSONObject json = fetchSummary(token);
            JSONObject display = json.getJSONObject("display");
            views.setTextViewText(R.id.widget_headline, display.getString("headline"));
            views.setTextViewText(R.id.widget_sub, display.getString("sub"));
            views.setProgressBar(R.id.widget_progress, 100, json.getInt("usedPct"), false);
            views.setTextViewText(R.id.widget_challenge, display.optString("challenge", ""));
        } catch (Exception e) {
            // Name the reason. A bare "could not refresh" hides the difference
            // between a rejected token and no network at all, and that difference
            // is the whole diagnosis.
            String reason = (e instanceof IllegalStateException && e.getMessage() != null)
                    ? e.getMessage()
                    : "no connection";
            views.setTextViewText(R.id.widget_sub, "Couldn't refresh - " + reason);
        }

        manager.updateAppWidget(widgetId, views);
    }

    private JSONObject fetchSummary(String token) throws Exception {
        HttpURLConnection connection =
                (HttpURLConnection) new URL(BASE_URL + "/api/widget/summary").openConnection();
        try {
            connection.setRequestMethod("GET");
            connection.setRequestProperty("Authorization", "Bearer " + token);
            connection.setConnectTimeout(TIMEOUT_MS);
            connection.setReadTimeout(TIMEOUT_MS);

            // Android's HttpURLConnection throws instead of returning the code
            // when a 401 carries a challenge it cannot answer. Asking twice
            // returns the real status; without this a rejected token looks
            // exactly like having no network at all.
            int status;
            try {
                status = connection.getResponseCode();
            } catch (java.io.IOException challenge) {
                try {
                    status = connection.getResponseCode();
                } catch (java.io.IOException again) {
                    throw new IllegalStateException("token rejected");
                }
            }

            if (status != 200) {
                throw new IllegalStateException("HTTP " + status);
            }

            StringBuilder body = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(connection.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    body.append(line);
                }
            }
            return new JSONObject(body.toString());
        } finally {
            connection.disconnect();
        }
    }

    private PendingIntent refreshIntent(Context context) {
        Intent intent = new Intent(context, TracoWidgetProvider.class).setAction(ACTION_REFRESH);
        return PendingIntent.getBroadcast(
                context, 0, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private PendingIntent openIntent(Context context, String path) {
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(BASE_URL + path))
                .setPackage(context.getPackageName());
        return PendingIntent.getActivity(
                context, path.hashCode(), intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
}
