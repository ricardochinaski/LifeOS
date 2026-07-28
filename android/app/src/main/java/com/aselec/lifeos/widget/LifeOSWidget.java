package com.aselec.lifeos.widget;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;
import com.aselec.lifeos.R;

public class LifeOSWidget extends AppWidgetProvider {

    private static final String PREFS_NAME = "lifeos_widget_data";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String status = prefs.getString("shift_status", "Faena Minera");
        String dayInfo = prefs.getString("shift_day", "Dia 1 de 14");
        boolean isRest = prefs.getBoolean("shift_isRest", false);

        for (int appWidgetId : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.lifeos_widget_layout);

            views.setTextViewText(R.id.widget_shift_status, status);
            views.setTextViewText(R.id.widget_shift_day, dayInfo);

            if (isRest) {
                views.setInt(R.id.widget_shift_status, "setTextColor", 0xFF34D399);
            } else {
                views.setInt(R.id.widget_shift_status, "setTextColor", 0xFFF59E0B);
            }

            Intent intent = new Intent(context, getMainActivityClass());
            PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            views.setOnClickPendingIntent(R.id.widget_icon, pendingIntent);
            views.setOnClickPendingIntent(R.id.widget_shift_status, pendingIntent);

            appWidgetManager.updateAppWidget(appWidgetId, views);
        }
    }

    private Class<?> getMainActivityClass() {
        try {
            return Class.forName("com.aselec.lifeos.MainActivity");
        } catch (ClassNotFoundException e) {
            throw new RuntimeException(e);
        }
    }
}
