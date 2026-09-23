import { render, act, fireEvent } from "@testing-library/react";
import Item from "lib/items/Item";
import { TimelineContext, TimelineContextType } from "lib/timeline/TimelineStateContext";
import { noop } from "test-utility";
import { SelectUnits } from "lib/utility/calendar";
import { TimelineContext as TimelineContextValue } from "lib/types/main";

const interactState = vi.hoisted(() => ({
  draggableConfig: null as null | { enabled: boolean },
  handlers: {} as Record<string, (e: unknown) => void>,
}));

vi.mock("interactjs", () => {
  const chain: Record<string, unknown> = {
    resizable: () => chain,
    draggable: (config: { enabled: boolean }) => {
      interactState.draggableConfig = config;
      return chain;
    },
    styleCursor: () => chain,
    on: (name: string, fn: (e: unknown) => void) => {
      interactState.handlers[name] = fn;
      return chain;
    },
  };
  return { default: () => chain };
});

const now = Date.now();
const oneHour = 1000 * 60 * 60;

const defaultKeys = {
  groupIdKey: "id",
  groupTitleKey: "title",
  groupLabelKey: "title",
  groupRightTitleKey: "rightTitle",
  itemIdKey: "id",
  itemTitleKey: "title",
  itemDivTitleKey: "title",
  itemGroupKey: "group",
  itemTimeStartKey: "start_time",
  itemTimeEndKey: "end_time",
};

const mockTimelineContext: TimelineContextType = {
  getTimelineState: () =>
    ({
      visibleTimeStart: now - oneHour,
      visibleTimeEnd: now + 3 * oneHour,
      canvasTimeStart: now - 2 * oneHour,
      canvasTimeEnd: now + 4 * oneHour,
      canvasWidth: 3000,
      timelineUnit: "hour" as SelectUnits,
      timelineWidth: 1000,
    }) as TimelineContextValue,
  getLeftOffsetFromDate: () => 0,
  getDateFromLeftOffsetPosition: () => 0,
  showPeriod: noop,
};

const defaultItem = {
  id: 1,
  group: 1,
  title: "Test Item",
  start_time: now,
  end_time: now + oneHour,
};

const defaultDimensions = {
  left: 100,
  top: 50,
  width: 200,
  height: 30,
  collisionLeft: 100,
  collisionWidth: 200,
  isDragging: false,
  originalLeft: 100,
  stack: true,
  order: { index: 0, group: { id: 1, title: "Group 1" } },
};

// `timeFor` needs a scroll container to compute offsets from.
const scrollRef = document.createElement("div");

const defaultProps = {
  item: defaultItem,
  keys: defaultKeys,
  order: { index: 0 },
  dimensions: defaultDimensions,
  selected: false,
  canChangeGroup: true,
  canMove: true,
  canSelect: true,
  canResizeLeft: false,
  canResizeRight: false,
  useResizeHandle: false,
  canvasTimeStart: now - 2 * oneHour,
  canvasTimeEnd: now + 4 * oneHour,
  canvasWidth: 3000,
  minResizeWidth: 20,
  dragSnap: 0,
  onSelect: noop,
  onDrag: noop,
  onDrop: noop,
  onResizing: noop,
  onResized: noop,
  onItemDoubleClick: noop,
  groupTops: [0, 40],
  scrollRef,
  scrollOffset: 0,
};

const renderItem = (props = {}) =>
  render(
    <TimelineContext.Provider value={mockTimelineContext}>
      <Item {...defaultProps} {...props} />
    </TimelineContext.Provider>
  );

const startDrag = (container: HTMLElement) => {
  const item = container.querySelector(".rct-item") as HTMLElement;
  const event = {
    pageX: 100,
    pageY: 100,
    clientX: 100,
    clientY: 100,
    pointerType: "mouse",
    target: item,
  };
  act(() => {
    interactState.handlers.dragstart?.(event);
  });
};

describe("Item dragWithoutSelect", () => {
  beforeEach(() => {
    interactState.draggableConfig = null;
    interactState.handlers = {};
  });

  it("enables dragging for an unselected movable item", () => {
    renderItem({ selected: false, canMove: true, dragWithoutSelect: true });
    expect(interactState.draggableConfig).toEqual({ enabled: true });
  });

  it("does not mount interact for an unselected item when the flag is off", () => {
    renderItem({ selected: false, canMove: true, dragWithoutSelect: false });
    expect(interactState.draggableConfig).toBeNull();
  });

  it("does not mount interact for an unselected item that cannot move", () => {
    renderItem({ selected: false, canMove: false, dragWithoutSelect: true });
    expect(interactState.draggableConfig).toBeNull();
  });

  it("selects an unselected item on dragstart by default", () => {
    const onSelect = vi.fn();
    const { container } = renderItem({
      selected: false,
      canMove: true,
      dragWithoutSelect: true,
      onSelect,
    });

    startDrag(container);

    expect(onSelect).toHaveBeenCalledWith(1, "click", expect.anything());
  });

  it("does not select on dragstart when selectOnDragStart is false", () => {
    const onSelect = vi.fn();
    const { container } = renderItem({
      selected: false,
      canMove: true,
      dragWithoutSelect: true,
      selectOnDragStart: false,
      onSelect,
    });

    startDrag(container);

    expect(onSelect).not.toHaveBeenCalled();
  });

  it("does not select on dragstart when canSelect is false", () => {
    const onSelect = vi.fn();
    const { container } = renderItem({
      selected: false,
      canMove: true,
      dragWithoutSelect: true,
      canSelect: false,
      onSelect,
    });

    startDrag(container);

    expect(onSelect).not.toHaveBeenCalled();
  });

  describe("user supplied onClick", () => {
    const renderWithOnClick = (onClick: () => void) =>
      renderItem({
        selected: false,
        canMove: true,
        dragWithoutSelect: true,
        item: { ...defaultItem, itemProps: { onClick } },
      });

    it("is called when there was no drag", () => {
      const onClick = vi.fn();
      const { container } = renderWithOnClick(onClick);

      fireEvent.click(container.querySelector(".rct-item")!);

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("is not called after a drag", () => {
      const onClick = vi.fn();
      const { container } = renderWithOnClick(onClick);

      startDrag(container);
      fireEvent.click(container.querySelector(".rct-item")!);

      expect(onClick).not.toHaveBeenCalled();
    });

    it("is called again after a pointerdown following a drag without a click", () => {
      const onClick = vi.fn();
      const { container } = renderWithOnClick(onClick);

      // A drag that ends without a click (e.g. pointer released outside the item)
      startDrag(container);

      const item = container.querySelector(".rct-item")!;
      fireEvent.pointerDown(item);
      fireEvent.click(item);

      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });
});

describe("Item custom renderer click suppression", () => {
  beforeEach(() => {
    interactState.draggableConfig = null;
    interactState.handlers = {};
  });

  // Mirrors a custom renderer (e.g. Schedule.tsx) that puts its own `onClick`
  // directly on the item root instead of passing it through `getItemProps`.
  const renderWithCustomOnClick = (onClick: () => void) =>
    renderItem({
      selected: false,
      canMove: true,
      dragWithoutSelect: true,
      itemRenderer: ({ getItemProps }: { getItemProps: () => Record<string, unknown> }) => {
        const { key, ref, ...rest } = getItemProps();
        return <div {...rest} ref={ref as never} key={key as never} onClick={onClick} />;
      },
    });

  it("does not call the renderer's own onClick after a drag", () => {
    const onClick = vi.fn();
    const { container } = renderWithCustomOnClick(onClick);

    startDrag(container);
    fireEvent.click(container.querySelector(".rct-item")!);

    expect(onClick).not.toHaveBeenCalled();
  });

  it("still calls the renderer's own onClick for a plain click", () => {
    const onClick = vi.fn();
    const { container } = renderWithCustomOnClick(onClick);

    fireEvent.click(container.querySelector(".rct-item")!);

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
