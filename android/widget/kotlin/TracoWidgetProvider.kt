package app.vercel.traco_pi.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.RemoteViews
import app.vercel.traco_pi.R
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import kotlin.concurrent.thread

/**
 * The traco home-screen widget.
 *
 * It reads /api/widget/summary with a bearer token the user pasted when adding
 * the widget. That endpoint already returns preformatted display strings, so
 * nothing here knows about currencies or the rollover rules — if the budgeting
 * logic changes on the web side, the widget follows for free.
 */
class TracoWidgetProvider : AppWidgetProvider() {

    companion object {
        const val PREFS = "traco_widget"
        const val KEY_TOKEN = "token"
        const val ACTION_REFRESH = "app.vercel.traco_pi.widget.REFRESH"

        // Must match the deployed site; a token is only valid against it.
        const val BASE_URL = "https://traco-pi.vercel.app"

        fun tokenFor(context: Context, widgetId: Int): String? =
            context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .getString(KEY_TOKEN + "." + widgetId, null)

        fun saveToken(context: Context, widgetId: Int, token: String) {
            context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit()
                .putString(KEY_TOKEN + "." + widgetId, token)
                .apply()
        }
    }

    override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) {
        // A BroadcastReceiver is killed as soon as onReceive returns, so the
        // network call has to hold the process open explicitly.
        val pending = goAsync()
        thread {
            try {
                ids.forEach { render(context, manager, it) }
            } finally {
                pending.finish()
            }
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (intent.action == ACTION_REFRESH) {
            val manager = AppWidgetManager.getInstance(context)
            val ids = manager.getAppWidgetIds(
                ComponentName(context, TracoWidgetProvider::class.java)
            )
            onUpdate(context, manager, ids)
        }
    }

    override fun onDeleted(context: Context, ids: IntArray) {
        val editor = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
        ids.forEach { editor.remove(KEY_TOKEN + "." + it) }
        editor.apply()
    }

    private fun render(context: Context, manager: AppWidgetManager, widgetId: Int) {
        val views = RemoteViews(context.packageName, R.layout.widget_traco)

        // Tapping the body refreshes; tapping "+ Log" deep-links into the app.
        views.setOnClickPendingIntent(R.id.widget_root, refreshIntent(context))
        views.setOnClickPendingIntent(R.id.widget_add, openIntent(context, "/dashboard?log=1"))

        val token = tokenFor(context, widgetId)
        if (token == null) {
            views.setTextViewText(R.id.widget_headline, "Not set up")
            views.setTextViewText(R.id.widget_sub, "Remove and re-add to enter a token")
            manager.updateAppWidget(widgetId, views)
            return
        }

        try {
            val json = fetchSummary(token)
            val display = json.getJSONObject("display")
            views.setTextViewText(R.id.widget_headline, display.getString("headline"))
            views.setTextViewText(R.id.widget_sub, display.getString("sub"))
            views.setProgressBar(R.id.widget_progress, 100, json.getInt("usedPct"), false)
            views.setTextViewText(R.id.widget_challenge, display.optString("challenge", ""))
        } catch (e: Exception) {
            // Say so rather than going blank; the numbers already on screen are
            // better than nothing until the next tap.
            views.setTextViewText(R.id.widget_sub, "Couldn't refresh - tap to retry")
        }

        manager.updateAppWidget(widgetId, views)
    }

    private fun fetchSummary(token: String): JSONObject {
        val connection = URL(BASE_URL + "/api/widget/summary")
            .openConnection() as HttpURLConnection
        connection.requestMethod = "GET"
        connection.setRequestProperty("Authorization", "Bearer " + token)
        connection.connectTimeout = 10000
        connection.readTimeout = 10000
        try {
            if (connection.responseCode != 200) {
                throw IllegalStateException("HTTP " + connection.responseCode)
            }
            return JSONObject(
                connection.inputStream.bufferedReader().use { it.readText() }
            )
        } finally {
            connection.disconnect()
        }
    }

    private fun refreshIntent(context: Context): PendingIntent =
        PendingIntent.getBroadcast(
            context,
            0,
            Intent(context, TracoWidgetProvider::class.java).setAction(ACTION_REFRESH),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

    private fun openIntent(context: Context, path: String): PendingIntent =
        PendingIntent.getActivity(
            context,
            path.hashCode(),
            Intent(Intent.ACTION_VIEW, Uri.parse(BASE_URL + path))
                .setPackage(context.packageName),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
}
