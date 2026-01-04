import { useState, useCallback } from 'react';
import Link from 'next/link';

export interface Widget {
  id: string;
  title: string;
  description: string;
  icon: string;
  href: string;
  color: string;
  defaultSize: WidgetSize;
  content?: React.ReactNode;
}

export interface WidgetSize {
  cols: number;
  rows: number;
}

export interface WidgetPosition {
  widgetId: string;
  x: number;
  y: number;
  cols: number;
  rows: number;
}

export interface DashboardLayout {
  positions: WidgetPosition[];
  starredWidgets: string[];
}

interface WidgetGridProps {
  widgets: Widget[];
  layout: DashboardLayout;
  onLayoutChange: (layout: DashboardLayout) => void;
  editMode: boolean;
  showStarred?: boolean;
  stats?: Record<string, React.ReactNode>;
}

const GRID_COLS = 4;
const CELL_SIZE = 180; // px
const GAP = 16; // px

export default function WidgetGrid({
  widgets,
  layout,
  onLayoutChange,
  editMode,
  showStarred = false,
  stats = {},
}: WidgetGridProps) {
  const [draggingWidget, setDraggingWidget] = useState<string | null>(null);
  const [resizingWidget, setResizingWidget] = useState<string | null>(null);

  // Filter widgets based on starred status if showing starred only
  const displayWidgets = showStarred
    ? widgets.filter((w) => layout.starredWidgets.includes(w.id))
    : widgets;

  // Get position for a widget (or default position)
  const getWidgetPosition = useCallback(
    (widgetId: string, index: number): WidgetPosition => {
      const existing = layout.positions.find((p) => p.widgetId === widgetId);
      if (existing) return existing;

      // Default grid position based on index
      const widget = widgets.find((w) => w.id === widgetId);
      return {
        widgetId,
        x: index % GRID_COLS,
        y: Math.floor(index / GRID_COLS),
        cols: widget?.defaultSize.cols || 1,
        rows: widget?.defaultSize.rows || 1,
      };
    },
    [layout.positions, widgets]
  );

  const toggleStar = useCallback(
    (widgetId: string) => {
      const isStarred = layout.starredWidgets.includes(widgetId);
      const newStarred = isStarred
        ? layout.starredWidgets.filter((id) => id !== widgetId)
        : [...layout.starredWidgets, widgetId];

      onLayoutChange({
        ...layout,
        starredWidgets: newStarred,
      });
    },
    [layout, onLayoutChange]
  );

  const updateWidgetSize = useCallback(
    (widgetId: string, cols: number, rows: number) => {
      const existingIndex = layout.positions.findIndex((p) => p.widgetId === widgetId);
      const position = getWidgetPosition(widgetId, widgets.findIndex((w) => w.id === widgetId));

      const newPosition = { ...position, cols, rows };
      const newPositions =
        existingIndex >= 0
          ? layout.positions.map((p, i) => (i === existingIndex ? newPosition : p))
          : [...layout.positions, newPosition];

      onLayoutChange({
        ...layout,
        positions: newPositions,
      });
    },
    [layout, onLayoutChange, getWidgetPosition, widgets]
  );

  const handleDragStart = (e: React.DragEvent, widgetId: string) => {
    if (!editMode) return;
    e.dataTransfer.setData('widgetId', widgetId);
    setDraggingWidget(widgetId);
  };

  const handleDragEnd = () => {
    setDraggingWidget(null);
  };

  const handleDrop = (e: React.DragEvent, targetX: number, targetY: number) => {
    if (!editMode) return;
    e.preventDefault();

    const widgetId = e.dataTransfer.getData('widgetId');
    if (!widgetId) return;

    const position = getWidgetPosition(widgetId, widgets.findIndex((w) => w.id === widgetId));
    const newPosition = { ...position, x: targetX, y: targetY };

    const existingIndex = layout.positions.findIndex((p) => p.widgetId === widgetId);
    const newPositions =
      existingIndex >= 0
        ? layout.positions.map((p, i) => (i === existingIndex ? newPosition : p))
        : [...layout.positions, newPosition];

    onLayoutChange({
      ...layout,
      positions: newPositions,
    });

    setDraggingWidget(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!editMode) return;
    e.preventDefault();
  };

  // Render size selector for edit mode
  const renderSizeSelector = (widgetId: string, currentCols: number, currentRows: number) => {
    const sizes = [
      { cols: 1, rows: 1, label: '1x1' },
      { cols: 2, rows: 1, label: '2x1' },
      { cols: 1, rows: 2, label: '1x2' },
      { cols: 2, rows: 2, label: '2x2' },
      { cols: 3, rows: 1, label: '3x1' },
      { cols: 4, rows: 1, label: '4x1' },
      { cols: 3, rows: 2, label: '3x2' },
      { cols: 4, rows: 2, label: '4x2' },
    ];

    return (
      <div className="absolute top-2 right-2 z-10">
        <select
          value={`${currentCols}x${currentRows}`}
          onChange={(e) => {
            const [cols, rows] = e.target.value.split('x').map(Number);
            updateWidgetSize(widgetId, cols, rows);
          }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gray-700 text-white text-xs rounded px-2 py-1 border border-gray-600"
        >
          {sizes.map((size) => (
            <option key={size.label} value={size.label}>
              {size.label}
            </option>
          ))}
        </select>
      </div>
    );
  };

  return (
    <div className="relative">
      {/* Grid Layout */}
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`,
        }}
      >
        {displayWidgets.map((widget, index) => {
          const position = getWidgetPosition(widget.id, index);
          const isStarred = layout.starredWidgets.includes(widget.id);
          const isDragging = draggingWidget === widget.id;

          return (
            <div
              key={widget.id}
              draggable={editMode}
              onDragStart={(e) => handleDragStart(e, widget.id)}
              onDragEnd={handleDragEnd}
              onDrop={(e) => handleDrop(e, position.x, position.y)}
              onDragOver={handleDragOver}
              className={`relative transition-all duration-200 ${
                isDragging ? 'opacity-50 scale-95' : ''
              } ${editMode ? 'cursor-move' : ''}`}
              style={{
                gridColumn: `span ${position.cols}`,
                gridRow: `span ${position.rows}`,
              }}
            >
              {editMode ? (
                <div
                  className={`h-full bg-gray-900 rounded-lg p-4 border-2 border-dashed ${widget.color} hover:border-opacity-100 border-opacity-50`}
                >
                  {renderSizeSelector(widget.id, position.cols, position.rows)}

                  <div className="flex items-start justify-between">
                    <div className="text-3xl mb-2">{widget.icon}</div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStar(widget.id);
                      }}
                      className={`text-xl ${isStarred ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-400'}`}
                    >
                      {isStarred ? '★' : '☆'}
                    </button>
                  </div>
                  <h3 className="font-bold text-white mb-1">{widget.title}</h3>
                  <p className="text-gray-400 text-sm">{widget.description}</p>
                </div>
              ) : (
                <Link
                  href={widget.href}
                  className={`block h-full bg-gray-900 rounded-lg p-4 border ${widget.color} hover:border-opacity-100 border-opacity-50 transition-colors`}
                >
                  <div className="flex items-start justify-between">
                    <div className="text-3xl mb-2">{widget.icon}</div>
                    {isStarred && <span className="text-yellow-400 text-sm">★</span>}
                  </div>
                  <h3 className="font-bold text-white mb-1">{widget.title}</h3>
                  <p className="text-gray-400 text-sm">{widget.description}</p>

                  {/* Stats content if available */}
                  {stats[widget.id] && (
                    <div className="mt-3 pt-3 border-t border-gray-800">
                      {stats[widget.id]}
                    </div>
                  )}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Default widgets configuration
export const DEFAULT_WIDGETS: Widget[] = [
  {
    id: 'sales',
    title: 'Sales Dashboard',
    description: 'Revenue & analytics',
    icon: '💰',
    href: '/admin/sales',
    color: 'border-green-800 hover:border-green-500',
    defaultSize: { cols: 1, rows: 1 },
  },
  {
    id: 'orders',
    title: 'Orders',
    description: 'View & manage orders',
    icon: '📦',
    href: '/admin/orders',
    color: 'border-blue-800 hover:border-blue-500',
    defaultSize: { cols: 1, rows: 1 },
  },
  {
    id: 'auctions',
    title: 'Auctions',
    description: 'Manage auctions',
    icon: '🔨',
    href: '/admin/auctions',
    color: 'border-gray-800 hover:border-blue-500',
    defaultSize: { cols: 1, rows: 1 },
  },
  {
    id: 'marketplace',
    title: 'Marketplace',
    description: 'Listings & offers',
    icon: '🔄',
    href: '/admin/trading',
    color: 'border-purple-800 hover:border-purple-500',
    defaultSize: { cols: 1, rows: 1 },
  },
  {
    id: 'nfts',
    title: 'NFTs',
    description: 'Browse & manage NFTs',
    icon: '🌟',
    href: '/admin/nfts',
    color: 'border-gray-800 hover:border-blue-500',
    defaultSize: { cols: 1, rows: 1 },
  },
  {
    id: 'astronomical-data',
    title: 'Astronomical Data',
    description: 'Real data sources',
    icon: '🔭',
    href: '/admin/astronomical-data',
    color: 'border-indigo-800 hover:border-indigo-500',
    defaultSize: { cols: 1, rows: 1 },
  },
  {
    id: 'images',
    title: 'Image Generation',
    description: 'Generate NFT images',
    icon: '🎨',
    href: '/admin/images',
    color: 'border-gray-800 hover:border-blue-500',
    defaultSize: { cols: 1, rows: 1 },
  },
  {
    id: 'phases',
    title: 'Phases & Pricing',
    description: 'Timer controls & pricing',
    icon: '⏱️',
    href: '/admin/phases',
    color: 'border-orange-800 hover:border-orange-500',
    defaultSize: { cols: 1, rows: 1 },
  },
  {
    id: 'scoring',
    title: 'Scoring System',
    description: 'Scientific scoring & base price',
    icon: '🔬',
    href: '/admin/scoring',
    color: 'border-cyan-800 hover:border-cyan-500',
    defaultSize: { cols: 1, rows: 1 },
  },
  {
    id: 'benefactor',
    title: 'Benefactor',
    description: 'Donation tracking',
    icon: '💝',
    href: '/admin/benefactor-dashboard',
    color: 'border-pink-800 hover:border-pink-500',
    defaultSize: { cols: 1, rows: 1 },
  },
  {
    id: 'site',
    title: 'Site Management',
    description: 'Site status & pages',
    icon: '🌐',
    href: '/admin/site',
    color: 'border-gray-800 hover:border-blue-500',
    defaultSize: { cols: 1, rows: 1 },
  },
  {
    id: 'users',
    title: 'Users',
    description: 'User management',
    icon: '👥',
    href: '/admin/users',
    color: 'border-gray-800 hover:border-blue-500',
    defaultSize: { cols: 1, rows: 1 },
  },
  {
    id: 'security',
    title: 'Security',
    description: 'Audit logs & access',
    icon: '🔐',
    href: '/admin/security',
    color: 'border-red-800 hover:border-red-500',
    defaultSize: { cols: 1, rows: 1 },
  },
  {
    id: 'settings',
    title: 'Settings',
    description: 'Configure settings',
    icon: '⚙️',
    href: '/admin/settings',
    color: 'border-gray-800 hover:border-blue-500',
    defaultSize: { cols: 1, rows: 1 },
  },
];

export const DEFAULT_LAYOUT: DashboardLayout = {
  positions: [],
  starredWidgets: ['sales', 'orders', 'nfts', 'phases'],
};
