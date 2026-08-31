package app.vercel.traco_pi.twa.widget;

import android.app.Activity;
import android.appwidget.AppWidgetManager;
import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;

import app.vercel.traco_pi.twa.R;

/**
 * Shown once, when the widget is dropped on the home screen: the user pastes the
 * token generated in traco's Settings.
 *
 * The token is stored per widget id, so two widgets can point at two accounts,
 * and removing one does not disconnect the other.
 */
public class TracoWidgetConfigureActivity extends Activity {

    private int widgetId = AppWidgetManager.INVALID_APPWIDGET_ID;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Assume cancelled until the user actually saves: if they back out,
        // Android must not leave a dead widget sitting on the home screen.
        setResult(RESULT_CANCELED);
        setContentView(R.layout.widget_configure);

        Bundle extras = getIntent() == null ? null : getIntent().getExtras();
        if (extras != null) {
            widgetId = extras.getInt(
                    AppWidgetManager.EXTRA_APPWIDGET_ID,
                    AppWidgetManager.INVALID_APPWIDGET_ID);
        }

        if (widgetId == AppWidgetManager.INVALID_APPWIDGET_ID) {
            finish();
            return;
        }

        final EditText input = findViewById(R.id.token_input);
        Button save = findViewById(R.id.save_button);

        save.setOnClickListener(view -> {
            String token = input.getText().toString().trim();
            if (token.isEmpty()) {
                Toast.makeText(this, "Paste the token from Settings", Toast.LENGTH_SHORT).show();
                return;
            }

            TracoWidgetProvider.saveToken(this, widgetId, token);
            new TracoWidgetProvider().onUpdate(
                    this,
                    AppWidgetManager.getInstance(this),
                    new int[] { widgetId });

            setResult(
                    RESULT_OK,
                    new Intent().putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, widgetId));
            finish();
        });
    }
}
