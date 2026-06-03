"""
Generate UML Activity Diagram with Swimlanes:
  Administrator Role Management Activity (Figure 2.5)
Monochrome, academic standard, publication quality.
Uses matplotlib for precise vector rendering.

Swimlanes:
  - Administrator: user-initiated actions
  - React App (Frontend): UI logic, role validation
  - Supabase (Backend): database update
"""
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch

# ==============================================================
# Drawing Primitives (same style as previous diagrams)
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

LANE_W = 3.4
TOTAL_W = 3 * LANE_W  # 10.2

L1_X = LANE_W / 2
L2_X = LANE_W + LANE_W / 2
L3_X = 2 * LANE_W + LANE_W / 2

L1_RIGHT = LANE_W
L2_RIGHT = 2 * LANE_W

Y_TOP = 13.5
ROW_STEP = 1.05
BOX_H = 0.50
DS = 0.32

r = {}
y = Y_TOP - 0.8
r['initial'] = y;         y -= 0.50
r['sign_in'] = y;         y -= ROW_STEP
r['req_panel'] = y;       y -= ROW_STEP
r['fetch_data'] = y;      y -= ROW_STEP
r['disp_panel'] = y;      y -= ROW_STEP
r['sel_role'] = y;        y -= ROW_STEP
r['d_self'] = y;          y -= ROW_STEP
r['show_err'] = y;        y -= ROW_STEP
r['update_db'] = y;       y -= ROW_STEP
r['disp_succ'] = y;       y -= 0.75
r['final'] = y

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

outer = patches.Rectangle(
    (0, frame_bot), TOTAL_W, frame_top - frame_bot,
    fc='none', ec='black', lw=1.5, zorder=2
)
ax.add_patch(outer)

for bx in [L1_RIGHT, L2_RIGHT]:
    ax.plot([bx, bx], [frame_bot, frame_top - HEADER_H],
            color='black', lw=1.0, zorder=2)

header_rect = patches.Rectangle(
    (0, frame_top - HEADER_H), TOTAL_W, HEADER_H,
    fc='white', ec='black', lw=1.5, zorder=3
)
ax.add_patch(header_rect)

for bx in [L1_RIGHT, L2_RIGHT]:
    ax.plot([bx, bx], [frame_top - HEADER_H, frame_top],
            color='black', lw=1.0, zorder=3)

header_y = frame_top - HEADER_H / 2
ax.text(L1_X, header_y, 'Administrator', ha='center', va='center',
        fontsize=10, fontfamily='sans-serif', fontweight='bold', zorder=6)
ax.text(L2_X, header_y, 'React App', ha='center', va='center',
        fontsize=10, fontfamily='sans-serif', fontweight='bold', zorder=6)
ax.text(L3_X, header_y, 'Supabase', ha='center', va='center',
        fontsize=10, fontfamily='sans-serif', fontweight='bold', zorder=6)

# ==============================================================
# Draw Nodes
# ==============================================================

draw_filled_circle(ax, L1_X, r['initial'])
draw_action(ax, L1_X, r['sign_in'], 'Sign in as\nadministrator', w=2.4)
draw_action(ax, L2_X, r['req_panel'], 'Check admin role\n& request data', w=2.4)
draw_action(ax, L3_X, r['fetch_data'], 'Fetch stats &\nusers list', w=2.4)
draw_action(ax, L2_X, r['disp_panel'], 'Display Admin\nPanel', w=2.4)
draw_action(ax, L1_X, r['sel_role'], 'Select new role\nfor a user', w=2.4)
draw_decision(ax, L2_X, r['d_self'])
ax.text(L2_X + DS + 0.08, r['d_self'] + 0.18, 'Is target\ncurrent admin?',
        ha='left', va='bottom', fontsize=7.5, fontfamily='sans-serif',
        fontstyle='italic', zorder=6)
draw_action(ax, L2_X, r['show_err'], 'Show error\nmessage', w=2.4)
draw_action(ax, L3_X, r['update_db'], 'Update user role\nin profiles table', w=2.6)
draw_action(ax, L2_X, r['disp_succ'], 'Update UI &\nshow success', w=2.4)
draw_final_node(ax, L2_X, r['final'])

# ==============================================================
# Draw Arrows (Flow)
# ==============================================================

draw_arrow(ax, L1_X, r['initial'] - 0.16, L1_X, r['sign_in'] + BOX_H / 2)

draw_polyline(ax, [
    (L1_X, r['sign_in'] - BOX_H / 2),
    (L1_X, (r['sign_in'] + r['req_panel']) / 2),
    (L2_X, (r['sign_in'] + r['req_panel']) / 2),
    (L2_X, r['req_panel'] + BOX_H / 2)
])

draw_polyline(ax, [
    (L2_X, r['req_panel'] - BOX_H / 2),
    (L2_X, (r['req_panel'] + r['fetch_data']) / 2),
    (L3_X, (r['req_panel'] + r['fetch_data']) / 2),
    (L3_X, r['fetch_data'] + BOX_H / 2)
])

draw_polyline(ax, [
    (L3_X, r['fetch_data'] - BOX_H / 2),
    (L3_X, (r['fetch_data'] + r['disp_panel']) / 2),
    (L2_X, (r['fetch_data'] + r['disp_panel']) / 2),
    (L2_X, r['disp_panel'] + BOX_H / 2)
])

draw_polyline(ax, [
    (L2_X, r['disp_panel'] - BOX_H / 2),
    (L2_X, (r['disp_panel'] + r['sel_role']) / 2),
    (L1_X, (r['disp_panel'] + r['sel_role']) / 2),
    (L1_X, r['sel_role'] + BOX_H / 2)
])

draw_polyline(ax, [
    (L1_X, r['sel_role'] - BOX_H / 2),
    (L1_X, (r['sel_role'] + r['d_self']) / 2),
    (L2_X, (r['sel_role'] + r['d_self']) / 2),
    (L2_X, r['d_self'] + DS)
])

# Decision [Yes] (Target is self) -> show error
draw_arrow_label(ax, L2_X, r['d_self'] - DS, L2_X, r['show_err'] + BOX_H / 2, '[Yes]', side='right')

# Show error -> Loop back to Admin Panel
LOOP_L = L1_RIGHT + 0.15
draw_polyline(ax, [
    (L2_X - 1.2, r['show_err']),
    (LOOP_L, r['show_err']),
    (LOOP_L, r['disp_panel']),
    (L2_X - 1.2, r['disp_panel'])
])

# Decision [No] (Target is not self) -> Update DB
draw_polyline(ax, [
    (L2_X + DS, r['d_self']),
    (L3_X, r['d_self']),
    (L3_X, r['update_db'] + BOX_H / 2)
])
ax.text(L2_X + DS + 0.08, r['d_self'] + 0.08, '[No]',
        ha='left', va='bottom', fontsize=7.5, fontfamily='sans-serif', zorder=6)

# Update DB -> Display success
draw_polyline(ax, [
    (L3_X, r['update_db'] - BOX_H / 2),
    (L3_X, (r['update_db'] + r['disp_succ']) / 2),
    (L2_X, (r['update_db'] + r['disp_succ']) / 2),
    (L2_X, r['disp_succ'] + BOX_H / 2)
])

# Display success -> Final node
draw_arrow(ax, L2_X, r['disp_succ'] - BOX_H / 2, L2_X, r['final'] + 0.20)

# ==============================================================
# Save
# ==============================================================
plt.tight_layout()

out_base = '/Users/imnothoan/Desktop/Code/Mini_Learning_Management_System/docs/uml/05_activity_admin_role_management'
fig.savefig(out_base + '.png', dpi=300, bbox_inches='tight',
            facecolor='white', edgecolor='none')
fig.savefig(out_base + '.jpg', dpi=300, bbox_inches='tight',
            facecolor='white', edgecolor='none', pil_kwargs={'quality': 95})
print('Saved: 05_activity_admin_role_management.png and .jpg')
plt.close()
