package io.freemytv;

import android.graphics.Bitmap;
import android.graphics.BitmapShader;
import android.graphics.Canvas;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RectF;
import android.graphics.Shader;
import android.text.TextPaint;
import android.text.TextUtils;

/** Compact Home player. Only metadata supplied by Android is used; no artwork is downloaded. */
final class MusicCard {
    private final NowPlaying.Watch watch;
    private final RectF card = new RectF(), art = new RectF(), bar = new RectF();
    private final RectF[] buttons = {new RectF(), new RectF(), new RectF()};
    private final Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG | Paint.FILTER_BITMAP_FLAG);
    private final TextPaint titlePaint = new TextPaint(Paint.ANTI_ALIAS_FLAG), detailPaint = new TextPaint(Paint.ANTI_ALIAS_FLAG);
    private final Matrix matrix = new Matrix();
    private final Path play = new Path(), previous = new Path(), next = new Path();
    private Bitmap bitmap;
    private BitmapShader artwork;
    private float k, progress, timeWidth;
    private String title = "", subtitle = "", time = "";
    private String previousLabel, playLabel, pauseLabel, nextLabel;

    MusicCard(NowPlaying.Watch watch) { this.watch = watch; }

    void update(float scale) {
        if (scale <= 0) return;
        k = scale;
        card.set(80 * k, 46 * k, 840 * k, 146 * k);
        art.set(90 * k, 56 * k, 170 * k, 136 * k);
        titlePaint.setTypeface(Ui.medium);
        titlePaint.setTextSize(26 * k);
        detailPaint.setTypeface(Ui.medium);
        detailPaint.setTextSize(19 * k);
        title = TextUtils.ellipsize(watch.cardTitle == null ? "" : watch.cardTitle, titlePaint,
                445 * k, TextUtils.TruncateAt.END).toString();
        subtitle = TextUtils.ellipsize(watch.cardSubtitle == null ? "" : watch.cardSubtitle, detailPaint,
                445 * k, TextUtils.TruncateAt.END).toString();
        for (int i = 0; i < 3; i++) {
            float x = (650 + i * 60) * k;
            buttons[i].set(x, 70 * k, x + 54 * k, 124 * k);
        }
        triangle(play, buttons[1].centerX() + 2 * k, buttons[1].centerY(), false);
        triangle(previous, buttons[0].centerX() + 2 * k, buttons[0].centerY(), true);
        triangle(next, buttons[2].centerX() - 2 * k, buttons[2].centerY(), false);
        Bitmap image = watch.cardArt;
        if (image != null && image.isRecycled()) image = null;
        if (image != bitmap) {
            bitmap = image;
            artwork = image == null ? null : new BitmapShader(image, Shader.TileMode.CLAMP, Shader.TileMode.CLAMP);
        }
        if (artwork != null) {
            float s = Math.max(art.width() / bitmap.getWidth(), art.height() / bitmap.getHeight());
            matrix.setScale(s, s);
            matrix.postTranslate(art.centerX() - bitmap.getWidth() * s / 2, art.centerY() - bitmap.getHeight() * s / 2);
            artwork.setLocalMatrix(matrix);
        }
        previousLabel = Ui.tr("Previous track");
        playLabel = Ui.tr("Play");
        pauseLabel = Ui.tr("Pause");
        nextLabel = Ui.tr("Next track");
        tick();
    }

    private void triangle(Path path, float x, float y, boolean reverse) {
        float direction = reverse ? -1 : 1;
        path.rewind();
        path.moveTo(x - direction * 8 * k, y - 11 * k);
        path.lineTo(x + direction * 9 * k, y);
        path.lineTo(x - direction * 8 * k, y + 11 * k);
        path.close();
    }

    void tick() {
        long duration = watch.duration(), position = watch.position();
        progress = duration > 0 ? Math.min(1, (float) position / duration) : 0;
        time = duration > 0 ? time(position) + " / " + time(duration) : "";
        timeWidth = detailPaint.measureText(time);
    }

    private static String time(long millis) {
        long seconds = millis / 1000;
        return seconds / 60 + ":" + (seconds % 60 < 10 ? "0" : "") + seconds % 60;
    }

    String label(int i) {
        return i == 0 ? previousLabel : i == 2 ? nextLabel : watch.isPlaying() ? pauseLabel : playLabel;
    }

    void bounds(int i, RectF out) { out.set(buttons[i]); }

    int hit(float x, float y) {
        if (!watch.hasCard()) return -1;
        for (int i = 0; i < buttons.length; i++) if (buttons[i].contains(x, y)) return i;
        return -1;
    }

    void draw(Canvas c, boolean dark, int focus) {
        if (!watch.hasCard() || k <= 0) return;
        int ink = dark ? 0xFFF5F5F7 : 0xFF1D1D1F, dim = dark ? 0xFFB4B4BC : 0xFF62626B;
        paint.setShader(null);
        paint.setColor(dark ? 0xED29292E : 0xEDFFFFFF);
        c.drawRoundRect(card, 20 * k, 20 * k, paint);
        paint.setColor(dark ? 0xFF45454C : 0xFFE5E5EA);
        paint.setShader(artwork);
        c.drawRoundRect(art, 12 * k, 12 * k, paint);
        paint.setShader(null);
        if (artwork == null) {
            paint.setColor(dim);
            // A record, used when the player supplies no bitmap artwork.
            c.drawCircle(art.centerX(), art.centerY(), 23 * k, paint);
            paint.setColor(dark ? 0xFF29292E : 0xFFFFFFFF);
            c.drawCircle(art.centerX(), art.centerY(), 7 * k, paint);
        }
        titlePaint.setColor(ink);
        detailPaint.setColor(dim);
        c.drawText(title, 188 * k, 79 * k, titlePaint);
        c.drawText(subtitle, 188 * k, 105 * k, detailPaint);
        if (!time.isEmpty()) {
            c.drawText(time, 633 * k - timeWidth, 131 * k, detailPaint);
            bar.set(188 * k, 121 * k, 621 * k - timeWidth, 125 * k);
            paint.setColor(dark ? 0xFF55555E : 0xFFDADAE0);
            c.drawRoundRect(bar, 2 * k, 2 * k, paint);
            bar.right = bar.left + bar.width() * progress;
            paint.setColor(ink);
            c.drawRoundRect(bar, 2 * k, 2 * k, paint);
        }
        for (int i = 0; i < 3; i++) {
            RectF b = buttons[i];
            boolean enabled = watch.canControl(i);
            paint.setColor(i == focus ? (dark ? 0xFFFFFFFF : 0xFF1D1D1F) : (dark ? 0xFF3E3E46 : 0xFFEEEEF2));
            c.drawRoundRect(b, 27 * k, 27 * k, paint);
            paint.setColor(enabled ? (i == focus ? (dark ? 0xFF1D1D1F : 0xFFFFFFFF) : ink) : dim);
            paint.setAlpha(enabled ? 255 : 90);
            float x = b.centerX(), y = b.centerY();
            if (i == 1 && watch.isPlaying()) {
                c.drawRect(x - 8 * k, y - 10 * k, x - 3 * k, y + 10 * k, paint);
                c.drawRect(x + 3 * k, y - 10 * k, x + 8 * k, y + 10 * k, paint);
            } else {
                c.drawPath(i == 0 ? previous : i == 2 ? next : play, paint);
                if (i != 1) {
                    float lineX = x + (i == 0 ? -12 : 9) * k;
                    c.drawRect(lineX, y - 11 * k, lineX + 3 * k, y + 11 * k, paint);
                }
            }
            paint.setAlpha(255);
        }
    }
}
