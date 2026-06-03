"""
Generate UML Activity Diagram with Swimlanes: Student Learning Activity (Figure 2.3)
Monochrome, academic standard, publication quality.
Uses matplotlib for precise vector rendering.

Swimlanes:
  - Student: user-initiated actions
  - React App (Frontend): UI navigation and display logic
  - Supabase (Backend): database operations and triggers
"""
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch
import matplotlib.patheffects as pe

# ==============================================================
# Drawing Primitives
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
    """Decision diamond (empty, no label inside)."""
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

# Swimlane X centers and boundaries
LANE_W = 3.4          # width of each lane
TOTAL_W = 3 * LANE_W  # = 10.2

# Lane centers
L1_X = LANE_W / 2                  # Student:     1.7
L2_X = LANE_W + LANE_W / 2          # React App:   5.1
L3_X = 2 * LANE_W + LANE_W / 2      # Supabase:    8.5

# Lane boundaries (divider positions)
L1_LEFT = 0
L1_RIGHT = LANE_W          # = 3.4
L2_LEFT = LANE_W
L2_RIGHT = 2 * LANE_W      # = 6.8
L3_LEFT = 2 * LANE_W
L3_RIGHT = TOTAL_W          # = 10.2

# Vertical layout
Y_TOP = 16.5
Y_BOT = 0.3
ROW_STEP = 1.05
BOX_H = 0.50
DS = 0.32  # diamond half-size

# Row Y positions (top to bottom)
r = {}
y = Y_TOP - 0.8
r['initial'] = y;         y -= 0.50
r['sign_in'] = y;         y -= ROW_STEP
r['catalog'] = y;          y -= ROW_STEP
r['search'] = y;           y -= ROW_STEP
r['detail'] = y;           y -= ROW_STEP
r['d_enrolled'] = y;       y -= ROW_STEP
r['enroll_action'] = y;    y -= 0.65
r['merge1'] = y;           y -= 0.65
r['player'] = y;           y -= ROW_STEP
r['select'] = y;           y -= ROW_STEP
r['watch'] = y;            y -= ROW_STEP
r['d_complete'] = y;       y -= ROW_STEP
r['insert_lc'] = y;        y -= ROW_STEP
r['recalc'] = y;           y -= ROW_STEP
r['d_more'] = y;           y -= 0.75
r['final'] = y


# ==============================================================
# Create Figure
# ==============================================================
fig_h = (Y_TOP - Y_BOT + 1.0) * 0.95
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

# Lane dividers — single solid lines at lane boundaries
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
ax.text(L1_X, header_y, 'Student', ha='center', va='center',
        fontsize=10, fontfamily='sans-serif', fontweight='bold', zorder=6)
ax.text(L2_X, header_y, 'React App', ha='center', va='center',
        fontsize=10, fontfamily='sans-serif', fontweight='bold', zorder=6)
ax.text(L3_X, header_y, 'Supabase', ha='center', va='center',
        fontsize=10, fontfamily='sans-serif', fontweight='bold', zorder=6)

# ==============================================================
# Draw Nodes
# ==============================================================

# 1. Initial node — in Student lane
draw_filled_circle(ax, L1_X, r['initial'])

# 2. Sign in — Student
draw_action(ax, L1_X, r['sign_in'], 'Enter email\nand password', w=2.4)

# 3. Open course catalog — React App (navigation)
draw_action(ax, L2_X, r['catalog'], 'Display\ncourse catalog', w=2.4)

# 4. Search or filter — Student
draw_action(ax, L1_X, r['search'], 'Search or\nfilter courses', w=2.4)

# 5. Open course detail — React App
draw_action(ax, L2_X, r['detail'], 'Display\ncourse detail', w=2.4)

# 6. Decision: Already enrolled? — Supabase (check enrollment)
draw_decision(ax, L3_X, r['d_enrolled'])
ax.text(L3_X, r['d_enrolled'], '?', ha='center', va='center',
        fontsize=8, fontfamily='sans-serif', fontweight='bold', zorder=7)
ax.text(L3_X + DS + 0.08, r['d_enrolled'] + 0.18, 'Already\nenrolled?',
        ha='left', va='bottom', fontsize=7.5, fontfamily='sans-serif',
        fontstyle='italic', zorder=6)

# 7. Create enrollment — Supabase
draw_action(ax, L3_X, r['enroll_action'], 'Create\nenrollment record', w=2.4)

# 8. Merge bar — React App
draw_merge_bar(ax, L2_X, r['merge1'])

# 9. Open lesson player — React App
draw_action(ax, L2_X, r['player'], 'Open\nlesson player', w=2.4)

# 10. Select lesson — Student
draw_action(ax, L1_X, r['select'], 'Select lesson', w=2.4)

# 11. Watch video — Student
draw_action(ax, L1_X, r['watch'], 'Watch video\nor read notes', w=2.4)

# 12. Decision: Mark complete? — Student choice
draw_decision(ax, L1_X, r['d_complete'])
ax.text(L1_X - DS - 0.08, r['d_complete'], 'Mark\ncomplete?',
        ha='right', va='center', fontsize=7.5, fontfamily='sans-serif',
        fontstyle='italic', zorder=6)

# 13. Insert lesson completion — Supabase
draw_action(ax, L3_X, r['insert_lc'], 'Insert lesson\ncompletion', w=2.4)

# 14. Recalculate progress — Supabase (trigger)
draw_action(ax, L3_X, r['recalc'], 'Recalculate\ncourse progress', w=2.4)

# 15. Decision: More lessons? — React App
draw_decision(ax, L2_X, r['d_more'])
ax.text(L2_X, r['d_more'] + DS + 0.10, 'More lessons?',
        ha='center', va='bottom', fontsize=7.5, fontfamily='sans-serif',
        fontstyle='italic', zorder=6)

# 16. Final node — React App
draw_final_node(ax, L2_X, r['final'])


# ==============================================================
# Draw Arrows (Flow)
# ==============================================================

# Initial → Sign in
draw_arrow(ax, L1_X, r['initial'] - 0.16, L1_X, r['sign_in'] + BOX_H / 2)

# Sign in → Display catalog (cross lane: Student → React App)
draw_polyline(ax, [
    (L1_X, r['sign_in'] - BOX_H / 2),
    (L1_X, (r['sign_in'] + r['catalog']) / 2),
    (L2_X, (r['sign_in'] + r['catalog']) / 2),
    (L2_X, r['catalog'] + BOX_H / 2)
])

# Display catalog → Search (cross lane: React App → Student)
draw_polyline(ax, [
    (L2_X, r['catalog'] - BOX_H / 2),
    (L2_X, (r['catalog'] + r['search']) / 2),
    (L1_X, (r['catalog'] + r['search']) / 2),
    (L1_X, r['search'] + BOX_H / 2)
])

# Search → Display detail (cross lane: Student → React App)
draw_polyline(ax, [
    (L1_X, r['search'] - BOX_H / 2),
    (L1_X, (r['search'] + r['detail']) / 2),
    (L2_X, (r['search'] + r['detail']) / 2),
    (L2_X, r['detail'] + BOX_H / 2)
])

# Display detail → Decision enrolled (cross lane: React App → Supabase)
draw_polyline(ax, [
    (L2_X, r['detail'] - BOX_H / 2),
    (L2_X, (r['detail'] + r['d_enrolled']) / 2),
    (L3_X, (r['detail'] + r['d_enrolled']) / 2),
    (L3_X, r['d_enrolled'] + DS)
])

# Decision [No] → Create enrollment (straight down in Supabase lane)
draw_arrow_label(ax, L3_X, r['d_enrolled'] - DS, L3_X, r['enroll_action'] + BOX_H / 2,
                 '[No]', side='right')

# Create enrollment → Merge bar (cross lane: Supabase → React App)
draw_polyline(ax, [
    (L3_X, r['enroll_action'] - BOX_H / 2),
    (L3_X, r['merge1']),
    (L2_X + 0.28, r['merge1'])
])

# Decision [Yes] → Merge bar (cross lane: Supabase → React App)
# Go left from diamond, then down to merge
mid_y_yes = (r['d_enrolled'] + r['merge1']) / 2
draw_polyline(ax, [
    (L3_X - DS, r['d_enrolled']),
    (L2_X, r['d_enrolled']),
    (L2_X, r['merge1'] + 0.04)
])
ax.text(L3_X - DS - 0.08, r['d_enrolled'] + 0.10, '[Yes]',
        ha='right', va='bottom', fontsize=7.5, fontfamily='sans-serif', zorder=6)

# Merge bar → Open lesson player (straight down in React App lane)
draw_arrow(ax, L2_X, r['merge1'] - 0.04, L2_X, r['player'] + BOX_H / 2)

# Player → Select lesson (cross lane: React App → Student)
draw_polyline(ax, [
    (L2_X, r['player'] - BOX_H / 2),
    (L2_X, (r['player'] + r['select']) / 2),
    (L1_X, (r['player'] + r['select']) / 2),
    (L1_X, r['select'] + BOX_H / 2)
])

# Select → Watch (straight down in Student lane)
draw_arrow(ax, L1_X, r['select'] - BOX_H / 2, L1_X, r['watch'] + BOX_H / 2)

# Watch → Decision mark complete (straight down in Student lane)
draw_arrow(ax, L1_X, r['watch'] - BOX_H / 2, L1_X, r['d_complete'] + DS)

# Decision [No] → loop back to Select (right side loop in Student lane)
# Stay within Student lane boundary: L1_RIGHT = 3.2
LOOP_NO_X = L1_RIGHT - 0.15  # = 3.05, safely inside
draw_polyline(ax, [
    (L1_X + DS, r['d_complete']),
    (LOOP_NO_X, r['d_complete']),
    (LOOP_NO_X, r['select']),
    (L1_X + 2.4 / 2, r['select'])
])
ax.text(L1_X + DS + 0.08, r['d_complete'] + 0.10, '[No]',
        ha='left', va='bottom', fontsize=7.5, fontfamily='sans-serif', zorder=6)

# Decision [Yes] → Insert completion (cross lane: Student → Supabase)
draw_polyline(ax, [
    (L1_X, r['d_complete'] - DS),
    (L1_X, (r['d_complete'] + r['insert_lc']) / 2),
    (L3_X, (r['d_complete'] + r['insert_lc']) / 2),
    (L3_X, r['insert_lc'] + BOX_H / 2)
])
ax.text(L1_X + 0.10, r['d_complete'] - DS - 0.06, '[Yes]',
        ha='left', va='top', fontsize=7.5, fontfamily='sans-serif', zorder=6)

# Insert completion → Recalculate (straight down in Supabase lane)
draw_arrow(ax, L3_X, r['insert_lc'] - BOX_H / 2, L3_X, r['recalc'] + BOX_H / 2)

# Add "(trigger)" annotation under Recalculate
ax.text(L3_X, r['recalc'] - BOX_H / 2 - 0.10, '«trigger»',
        ha='center', va='top', fontsize=7, fontfamily='sans-serif',
        fontstyle='italic', color='black', zorder=6)

# Recalculate → Decision more lessons (cross lane: Supabase → React App)
mid_y_recalc = (r['recalc'] + r['d_more']) / 2
draw_polyline(ax, [
    (L3_X, r['recalc'] - BOX_H / 2),
    (L3_X, mid_y_recalc),
    (L2_X, mid_y_recalc),
    (L2_X, r['d_more'] + DS)
])

# Decision [Yes] → loop back to Select lesson (left side, within Student lane)
LOOP_YES_X = 0.25  # Stay inside the outer frame (x=0)
draw_polyline(ax, [
    (L2_X - DS, r['d_more']),
    (LOOP_YES_X, r['d_more']),
    (LOOP_YES_X, r['select']),
    (L1_X - 2.4 / 2, r['select'])
])
ax.text(L2_X - DS - 0.12, r['d_more'] - 0.12, '[Yes]',
        ha='right', va='top', fontsize=7.5, fontfamily='sans-serif', zorder=6)

# Decision [No] → Final node (straight down in React App lane)
draw_arrow_label(ax, L2_X, r['d_more'] - DS, L2_X, r['final'] + 0.20,
                 '[No]', side='right')


# ==============================================================
# Save
# ==============================================================
plt.tight_layout()

out_base = '/Users/imnothoan/Desktop/Code/Mini_Learning_Management_System/docs/uml/03_activity_student_learning'
fig.savefig(out_base + '.png', dpi=300, bbox_inches='tight',
            facecolor='white', edgecolor='none')
fig.savefig(out_base + '.jpg', dpi=300, bbox_inches='tight',
            facecolor='white', edgecolor='none', pil_kwargs={'quality': 95})
print('Saved: 03_activity_student_learning.png and .jpg')
plt.close()
