package app.vercel.traco_pi.widget

import android.app.Activity
import android.appwidget.AppWidgetManager
import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import app.vercel.traco_pi.R

/**
 * Shown once, when the widget is dropped on the home screen: the user pastes the
 * token generated in traco's Settings.
 *
 * The token is stored per widget id, so two widgets can point at two accounts,
 * and removing one does not disconnect the other.
 */
class TracoWidgetConfigureActivity : Activity() {

    private var widgetId = AppWidgetManager.INVALID_APPWIDGET_ID

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Assume cancelled until the user actually saves: if they back out,
        // Android must not leave a dead widget sitting on the home screen.
        setResult(RESULT_CANCELED)
        setContentView(R.layout.widget_configure)

        widgetId = intent?.extras?.getInt(
            AppWidgetManager.EXTRA_APPWIDGET_ID,
            AppWidgetManager.INVALID_APPWIDGET_ID
        ) ?: AppWidgetManager.INVALID_APPWIDGET_ID

        if (widgetId == AppWidgetManager.INVALID_APPWIDGET_ID) {
            finish()
            return
        }

        val input = findViewById<EditText>(R.id.token_input)
        findViewById<Button>(R.id.save_button).setOnClickListener {
            val token = input.text.toString().trim()
            if (token.isEmpty()) {
                Toast.makeText(this, "Paste the token from Settings", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            TracoWidgetProvider.saveToken(this, widgetId, token)
            TracoWidgetProvider().onUpdate(
                this,
                AppWidgetManager.getInstance(this),
                intArrayOf(widgetId)
            )

            setResult(
                RESULT_OK,
                Intent().putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, widgetId)
            )
            finish()
        }
    }
}
