"""
Generate UML Activity Diagram with Swimlanes:
  Instructor Course Authoring Activity (Figure 2.4)
Monochrome, academic standard, publication quality.
Uses matplotlib for precise vector rendering.

Swimlanes:
  - Instructor: user-initiated actions
  - React App (Frontend): UI navigation, form validation
  - Supabase (Backend): database + storage operations
"""
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch

# ==============================================================
# Drawing Primitives (same style as Figure 2.3)
# ==============================================================

def draw_filled_circle(ax, x, y, r=0.16, color='black'):
    """Initial node."""
    c = plt.Circle((x, y), r, fc=color, ec='black', lw=1.5, zorder=5)
    ax.add_patch(c)


def draw_final_node(ax, x, y, r_outer=0.20, r_inner=0.12):
    """Final node (bullseye)."""
    ax.add_patch(plt.Circle((x, y), r_outer, fc='white', ec='black', lw=2.0, zorder=5))
    ax.add_patch(plt.Circle((x, y), r_inner, fc='black', ec='black', lw=1, zorder=6))


def draw_action(ax, cx, cy, text, w=2.6, h=0.50):
    """Action state: rounded rectangle with centered text."""
    box = FancyBboxPatch(
        (cx - w / 2, cy - h / 2), w, h,
        boxstyle="round,pad=0.10",
        fc='white', ec='black', lw=1.2, zorder=4
    )
    ax.add_patch(box)
    ax.text(cx, cy, text, ha='center', va='center',
            fontsize=8.5, fontfamily='sans-serif', zorder=6)


def draw_decision(ax, cx, cy, s=0.32):
    """Decision diamond."""
    diamond = plt.Polygon(
        [(cx, cy + s), (cx + s, cy), (cx, cy - s), (cx - s, cy)],
        closed=True, fc='white', ec='black', lw=1.2, zorder=4
    )
    ax.add_patch(diamond)
    return s


def draw_merge_bar(ax, cx, cy, w=0.55):
    """Merge/synchronization bar."""
    bar = patches.Rectangle(
        (cx - w / 2, cy - 0.04), w, 0.08,
        fc='black', ec='black', lw=0.5, zorder=5
    )
    ax.add_patch(bar)


def draw_fork_bar(ax, cx, cy, w=0.55):
    """Fork bar (same visual as merge bar)."""
    draw_merge_bar(ax, cx, cy, w)


def draw_arrow(ax, x1, y1, x2, y2):
    """Simple straight arrow."""
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle='-|>', color='black', lw=1.0,
                                mutation_scale=11, shrinkA=0, shrinkB=0),
                zorder=3)


def draw_arrow_label(ax, x1, y1, x2, y2, label, side='right', offset=0.10):
    """Straight arrow with guard condition label."""
    draw_arrow(ax, x1, y1, x2, y2)
    mx, my = (x1 + x2) / 2, (y1 + y2) / 2
    if side == 'right':
        ax.text(mx + offset, my, label, ha='left', va='center',
                fontsize=7.5, fontfamily='sans-serif', zorder=6)
    elif side == 'left':
        ax.text(mx - offset, my, label, ha='right', va='center',
                fontsize=7.5, fontfamily='sans-serif', zorder=6)
    elif side == 'above':
        ax.text(mx, my + offset, label, ha='center', va='bottom',
                fontsize=7.5, fontfamily='sans-serif', zorder=6)
    elif side == 'below':
        ax.text(mx, my - offset, label, ha='center', va='top',
                fontsize=7.5, fontfamily='sans-serif', zorder=6)


def draw_polyline(ax, points, has_arrow=True):
    """Draw a multi-segment line through points, with optional arrowhead on last segment."""
    for i in range(len(points) - 2):
        ax.plot([points[i][0], points[i+1][0]], [points[i][1], points[i+1][1]],
                color='black', lw=1.0, zorder=3)
    if has_arrow:
        draw_arrow(ax, points[-2][0], points[-2][1], points[-1][0], points[-1][1])
    else:
        ax.plot([points[-2][0], points[-1][0]], [points[-2][1], points[-1][1]],
                color='black', lw=1.0, zorder=3)


# ==============================================================
# Layout Configuration
# ==============================================================

# Swimlane dimensions — 3 equal lanes, no margin gaps
LANE_W = 3.4
TOTAL_W = 3 * LANE_W  # = 10.2

# Lane centers
L1_X = LANE_W / 2                   # Instructor:  1.7
L2_X = LANE_W + LANE_W / 2          # React App:   5.1
L3_X = 2 * LANE_W + LANE_W / 2      # Supabase:    8.5

# Lane boundaries (divider positions)
L1_LEFT = 0
L1_RIGHT = LANE_W          # = 3.4
L2_RIGHT = 2 * LANE_W      # = 6.8
L3_RIGHT = TOTAL_W         # = 10.2

# Vertical layout
Y_TOP = 18.5
ROW_STEP = 1.05
BOX_H = 0.50
DS = 0.32  # diamond half-size

# Row Y positions (top to bottom)
r = {}
y = Y_TOP - 0.8
r['initial'] = y;          y -= 0.50
r['sign_in'] = y;          y -= ROW_STEP
r['manage'] = y;            y -= ROW_STEP
r['d_action'] = y;          y -= ROW_STEP
r['fill_meta'] = y;         y -= ROW_STEP
r['d_image'] = y;           y -= ROW_STEP
r['upload_img'] = y;        y -= 0.70
r['store_img'] = y;         y -= 0.70
r['merge_img'] = y;         y -= 0.70
r['add_lessons'] = y;       y -= ROW_STEP
r['d_more_lessons'] = y;    y -= ROW_STEP
r['click_save'] = y;        y -= ROW_STEP
r['validate'] = y;          y -= ROW_STEP
r['d_valid'] = y;           y -= ROW_STEP
r['save_db'] = y;           y -= ROW_STEP
r['redirect'] = y;          y -= 0.75
r['final'] = y


# ==============================================================
# Create Figure
# ==============================================================
fig_h = (Y_TOP - r['final'] + 1.5) * 0.92
fig, ax = plt.subplots(1, 1, figsize=(10, fig_h))
ax.set_xlim(-0.3, TOTAL_W + 0.3)
ax.set_ylim(r['final'] - 0.6, Y_TOP + 0.3)
ax.set_aspect('equal')
ax.axis('off')

# ==============================================================
# Draw Swimlane Frames
# ==============================================================
HEADER_H = 0.55
frame_top = Y_TOP
frame_bot = r['final'] - 0.45

# Outer frame
outer = patches.Rectangle(
    (0, frame_bot), TOTAL_W, frame_top - frame_bot,
    fc='none', ec='black', lw=1.5, zorder=2
)
ax.add_patch(outer)

# Lane dividers — single solid lines
for bx in [L1_RIGHT, L2_RIGHT]:
    ax.plot([bx, bx], [frame_bot, frame_top - HEADER_H],
            color='black', lw=1.0, ls='-', zorder=2)

# Header bar
header_rect = patches.Rectangle(
    (0, frame_top - HEADER_H), TOTAL_W, HEADER_H,
    fc='white', ec='black', lw=1.5, zorder=3
)
ax.add_patch(header_rect)

# Header dividers (same positions as lane dividers)
for bx in [L1_RIGHT, L2_RIGHT]:
    ax.plot([bx, bx], [frame_top - HEADER_H, frame_top],
            color='black', lw=1.0, zorder=3)

# Header labels
header_y = frame_top - HEADER_H / 2
ax.text(L1_X, header_y, 'Instructor', ha='center', va='center',
        fontsize=10, fontfamily='sans-serif', fontweight='bold', zorder=6)
ax.text(L2_X, header_y, 'React App', ha='center', va='center',
        fontsize=10, fontfamily='sans-serif', fontweight='bold', zorder=6)
ax.text(L3_X, header_y, 'Supabase', ha='center', va='center',
        fontsize=10, fontfamily='sans-serif', fontweight='bold', zorder=6)

# ==============================================================
# Draw Nodes
# ==============================================================

# 1. Initial node — Instructor
draw_filled_circle(ax, L1_X, r['initial'])

# 2. Sign in — Instructor
draw_action(ax, L1_X, r['sign_in'], 'Sign in as\ninstructor', w=2.4)

# 3. Open Manage Courses — React App
draw_action(ax, L2_X, r['manage'], 'Display\nManage Courses', w=2.4)

# 4. Decision: Create new or Edit? — Instructor
draw_decision(ax, L1_X, r['d_action'])
ax.text(L1_X + DS + 0.08, r['d_action'] + 0.18, 'Create new\nor edit?',
        ha='left', va='bottom', fontsize=7.5, fontfamily='sans-serif',
        fontstyle='italic', zorder=6)

# 5. Fill course metadata — Instructor
draw_action(ax, L1_X, r['fill_meta'], 'Fill course\nmetadata', w=2.4)

# 6. Decision: Upload image? — Instructor
draw_decision(ax, L1_X, r['d_image'])
ax.text(L1_X - DS - 0.08, r['d_image'], 'Upload\nimage?',
        ha='right', va='center', fontsize=7.5, fontfamily='sans-serif',
        fontstyle='italic', zorder=6)

# 7. Upload cover image — Instructor
draw_action(ax, L1_X, r['upload_img'], 'Select cover\nimage file', w=2.4)

# 8. Store image in Storage — Supabase
draw_action(ax, L3_X, r['store_img'], 'Store image in\nSupabase Storage', w=2.6)

# 9. Merge bar — Instructor
draw_merge_bar(ax, L1_X, r['merge_img'])

# 10. Add lessons — Instructor
draw_action(ax, L1_X, r['add_lessons'], 'Add lesson\n(title, video, note)', w=2.6)

# 11. Decision: Add more lessons? — Instructor
draw_decision(ax, L1_X, r['d_more_lessons'])
ax.text(L1_X, r['d_more_lessons'] + DS + 0.10, 'More lessons?',
        ha='center', va='bottom', fontsize=7.5, fontfamily='sans-serif',
        fontstyle='italic', zorder=6)

# 12. Click Save — Instructor
draw_action(ax, L1_X, r['click_save'], 'Click\n"Save course"', w=2.4)

# 13. Validate form — React App
draw_action(ax, L2_X, r['validate'], 'Validate\nform data', w=2.4)

# 14. Decision: Valid? — React App
draw_decision(ax, L2_X, r['d_valid'])
ax.text(L2_X + DS + 0.08, r['d_valid'] + 0.18, 'Valid?',
        ha='left', va='bottom', fontsize=7.5, fontfamily='sans-serif',
        fontstyle='italic', zorder=6)

# 15. Save to database — Supabase
draw_action(ax, L3_X, r['save_db'], 'Insert/Update\ncourse + lessons', w=2.6)

# 16. Redirect — React App
draw_action(ax, L2_X, r['redirect'], 'Redirect to\nManage Courses', w=2.4)

# 17. Final node — React App
draw_final_node(ax, L2_X, r['final'])


# ==============================================================
# Draw Arrows (Flow)
# ==============================================================

# Initial → Sign in
draw_arrow(ax, L1_X, r['initial'] - 0.16, L1_X, r['sign_in'] + BOX_H / 2)

# Sign in → Display Manage Courses (cross: Instructor → React App)
draw_polyline(ax, [
    (L1_X, r['sign_in'] - BOX_H / 2),
    (L1_X, (r['sign_in'] + r['manage']) / 2),
    (L2_X, (r['sign_in'] + r['manage']) / 2),
    (L2_X, r['manage'] + BOX_H / 2)
])

# Manage Courses → Decision action (cross: React App → Instructor)
draw_polyline(ax, [
    (L2_X, r['manage'] - BOX_H / 2),
    (L2_X, (r['manage'] + r['d_action']) / 2),
    (L1_X, (r['manage'] + r['d_action']) / 2),
    (L1_X, r['d_action'] + DS)
])

# Decision [Create] → Fill metadata (straight down, Instructor)
draw_arrow_label(ax, L1_X, r['d_action'] - DS, L1_X, r['fill_meta'] + BOX_H / 2,
                 '[Create]', side='right')

# Decision [Edit] → Fill metadata (also goes down, but from right side)
# For "Edit", the flow fetches existing data first then fills form
# Both paths lead to same action, so we just label [Edit] on the left
ax.text(L1_X - DS - 0.08, r['d_action'] - 0.05, '[Edit]',
        ha='right', va='top', fontsize=7.5, fontfamily='sans-serif', zorder=6)
# Draw a small curve from left of diamond merging into same path
draw_polyline(ax, [
    (L1_X - DS, r['d_action']),
    (L1_X - DS - 0.4, r['d_action']),
    (L1_X - DS - 0.4, r['fill_meta']),
    (L1_X - 2.4 / 2, r['fill_meta'])
])

# Fill metadata → Decision upload image? (straight down, Instructor)
draw_arrow(ax, L1_X, r['fill_meta'] - BOX_H / 2, L1_X, r['d_image'] + DS)

# Decision [Yes] → Upload image (straight down, Instructor)
draw_arrow_label(ax, L1_X, r['d_image'] - DS, L1_X, r['upload_img'] + BOX_H / 2,
                 '[Yes]', side='right')

# Upload image → Store in Supabase (cross: Instructor → Supabase)
draw_polyline(ax, [
    (L1_X, r['upload_img'] - BOX_H / 2),
    (L1_X, (r['upload_img'] + r['store_img']) / 2),
    (L3_X, (r['upload_img'] + r['store_img']) / 2),
    (L3_X, r['store_img'] + BOX_H / 2)
])

# Store image → Merge bar (cross: Supabase → Instructor)
draw_polyline(ax, [
    (L3_X, r['store_img'] - BOX_H / 2),
    (L3_X, r['merge_img']),
    (L1_X + 0.28, r['merge_img'])
])

# Decision [No] → Merge bar (skip image upload)
draw_polyline(ax, [
    (L1_X + DS, r['d_image']),
    (L1_RIGHT - 0.15, r['d_image']),
    (L1_RIGHT - 0.15, r['merge_img']),
    (L1_X + 0.28, r['merge_img'])
])
ax.text(L1_X + DS + 0.08, r['d_image'] + 0.10, '[No]',
        ha='left', va='bottom', fontsize=7.5, fontfamily='sans-serif', zorder=6)

# Merge bar → Add lessons (straight down, Instructor)
draw_arrow(ax, L1_X, r['merge_img'] - 0.04, L1_X, r['add_lessons'] + BOX_H / 2)

# Add lessons → Decision more lessons (straight down, Instructor)
draw_arrow(ax, L1_X, r['add_lessons'] - BOX_H / 2, L1_X, r['d_more_lessons'] + DS)

# Decision [Yes] → loop back to Add lessons (right side loop)
LOOP_R = L1_RIGHT - 0.15
draw_polyline(ax, [
    (L1_X + DS, r['d_more_lessons']),
    (LOOP_R, r['d_more_lessons']),
    (LOOP_R, r['add_lessons']),
    (L1_X + 2.6 / 2, r['add_lessons'])
])
ax.text(L1_X + DS + 0.08, r['d_more_lessons'] + 0.10, '[Yes]',
        ha='left', va='bottom', fontsize=7.5, fontfamily='sans-serif', zorder=6)

# Decision [No] → Click save (straight down, Instructor)
draw_arrow_label(ax, L1_X, r['d_more_lessons'] - DS, L1_X, r['click_save'] + BOX_H / 2,
                 '[No]', side='right')

# Click save → Validate (cross: Instructor → React App)
draw_polyline(ax, [
    (L1_X, r['click_save'] - BOX_H / 2),
    (L1_X, (r['click_save'] + r['validate']) / 2),
    (L2_X, (r['click_save'] + r['validate']) / 2),
    (L2_X, r['validate'] + BOX_H / 2)
])

# Validate → Decision valid (straight down, React App)
draw_arrow(ax, L2_X, r['validate'] - BOX_H / 2, L2_X, r['d_valid'] + DS)

# Decision [No] → loop back to Fill metadata (left side loop, long)
LOOP_INVALID_X = 0.25
draw_polyline(ax, [
    (L2_X - DS, r['d_valid']),
    (LOOP_INVALID_X, r['d_valid']),
    (LOOP_INVALID_X, r['fill_meta']),
    (L1_X - 2.4 / 2, r['fill_meta'])
])
ax.text(L2_X - DS - 0.08, r['d_valid'] + 0.10, '[No]',
        ha='right', va='bottom', fontsize=7.5, fontfamily='sans-serif', zorder=6)

# Decision [Yes] → Save to database (cross: React App → Supabase)
draw_polyline(ax, [
    (L2_X, r['d_valid'] - DS),
    (L2_X, (r['d_valid'] + r['save_db']) / 2),
    (L3_X, (r['d_valid'] + r['save_db']) / 2),
    (L3_X, r['save_db'] + BOX_H / 2)
])
ax.text(L2_X + 0.10, r['d_valid'] - DS - 0.06, '[Yes]',
        ha='left', va='top', fontsize=7.5, fontfamily='sans-serif', zorder=6)

# Save to database → Redirect (cross: Supabase → React App)
draw_polyline(ax, [
    (L3_X, r['save_db'] - BOX_H / 2),
    (L3_X, (r['save_db'] + r['redirect']) / 2),
    (L2_X, (r['save_db'] + r['redirect']) / 2),
    (L2_X, r['redirect'] + BOX_H / 2)
])

# Redirect → Final node (straight down, React App)
draw_arrow(ax, L2_X, r['redirect'] - BOX_H / 2, L2_X, r['final'] + 0.20)


# ==============================================================
# Save
# ==============================================================
plt.tight_layout()

out_base = '/Users/imnothoan/Desktop/Code/Mini_Learning_Management_System/docs/uml/04_activity_instructor_course_authoring'
fig.savefig(out_base + '.png', dpi=300, bbox_inches='tight',
            facecolor='white', edgecolor='none')
fig.savefig(out_base + '.jpg', dpi=300, bbox_inches='tight',
            facecolor='white', edgecolor='none', pil_kwargs={'quality': 95})
print('Saved: 04_activity_instructor_course_authoring.png and .jpg')
plt.close()
