package com.aselec.lifeos.plugin;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import com.aselec.lifeos.widget.LifeOSWidget;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "LifeOSWidget")
public class LifeOSWidgetPlugin extends Plugin {

    private static final String PREFS_NAME = "lifeos_widget_data";

    @PluginMethod
    public void updateWidget(PluginCall call) {
        String status = call.getString("shiftStatus", "LifeOS");
        String day = call.getString("shiftDay", "Turno 14x14");
        boolean isRest = call.getBoolean("isRest", false);

        SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit()
            .putString("shift_status", status)
            .putString("shift_day", day)
            .putBoolean("shift_isRest", isRest)
            .apply();

        try {
            Context context = getContext();
            AppWidgetManager manager = AppWidgetManager.getInstance(context);
            ComponentName widget = new ComponentName(context, LifeOSWidget.class);
            int[] ids = manager.getAppWidgetIds(widget);
            if (ids.length > 0) {
                new LifeOSWidget().onUpdate(context, manager, ids);
            }
        } catch (Exception ignored) {}

        call.resolve(new JSObject());
    }
}
