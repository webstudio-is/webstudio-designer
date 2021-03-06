/* eslint-disable prefer-const */
/* eslint-disable func-style */
/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/**
 * We had to copy this file from react-aria because we need pageX and pageY.
 */

import React, { HTMLAttributes, useMemo, useRef } from "react";
import { useGlobalListeners } from "@react-aria/utils";

interface MoveResult {
  /** Props to spread on the target element. */
  moveProps: HTMLAttributes<HTMLElement>;
}

interface EventBase {
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
}

export type PointerType = "mouse" | "pen" | "touch" | "keyboard" | "virtual";

interface BaseMoveEvent {
  /** The pointer type that triggered the move event. */
  pointerType: PointerType;
  /** Whether the shift keyboard modifier was held during the move event. */
  shiftKey: boolean;
  /** Whether the ctrl keyboard modifier was held during the move event. */
  ctrlKey: boolean;
  /** Whether the meta keyboard modifier was held during the move event. */
  metaKey: boolean;
  /** Whether the alt keyboard modifier was held during the move event. */
  altKey: boolean;
}

interface MoveStartEvent extends BaseMoveEvent {
  /** The type of move event being fired. */
  type: "movestart";
  target: HTMLElement;
  pageX: number;
  pageY: number;
}

interface MoveMoveEvent extends BaseMoveEvent {
  /** The type of move event being fired. */
  type: "move";
  /** The amount moved in the X direction since the last event. */
  deltaX: number;
  /** The amount moved in the Y direction since the last event. */
  deltaY: number;
  pageX: number;
  pageY: number;
}

interface MoveEndEvent extends BaseMoveEvent {
  /** The type of move event being fired. */
  type: "moveend";
}

interface MoveEvents {
  /** Handler that is called when a move interaction starts. */
  onMoveStart?: (e: MoveStartEvent) => void;
  /** Handler that is called when the element is moved. */
  onMove?: (e: MoveMoveEvent) => void;
  /** Handler that is called when a move interaction ends. */
  onMoveEnd?: (e: MoveEndEvent) => void;
}

/**
 * Handles move interactions across mouse, touch, and keyboard, including dragging with
 * the mouse or touch, and using the arrow keys. Normalizes behavior across browsers and
 * platforms, and ignores emulated mouse events on touch devices.
 */
export function useMove(props: MoveEvents): MoveResult {
  let state = useRef<{
    didMove: boolean;
    lastPosition: { pageX: number; pageY: number } | null;
    id: number | null;
  }>({ didMove: false, lastPosition: null, id: null });

  let { addGlobalListener, removeGlobalListener } = useGlobalListeners();

  // Because addGlobalListener is used to set callbacks,
  // noramlly it will "see" the version of "props" at the time of addGlobalListener call.
  // This in turn means that user's callbakcs will see old state variables etc.
  // To workaround this, we use a ref that always points to the latest props.
  let latestProps = useRef<MoveEvents>(props);
  latestProps.current = props;

  let moveProps = useMemo(() => {
    let moveProps: HTMLAttributes<HTMLElement> = {};

    let start = () => {
      //disableTextSelection();
      state.current.didMove = false;
    };
    let move = (
      originalEvent: MouseEvent | TouchEvent | React.KeyboardEvent,
      pointerType: PointerType,
      deltaX: number,
      deltaY: number
    ) => {
      if (deltaX === 0 && deltaY === 0) {
        return;
      }

      // FIXME: this is a temporary fix
      // we need to figure out how to properly support keyboard and touch
      if (
        !(originalEvent.target instanceof HTMLElement) ||
        !("pageX" in originalEvent)
      ) {
        return;
      }

      if (!state.current.didMove) {
        state.current.didMove = true;
        latestProps.current.onMoveStart?.({
          type: "movestart",
          pointerType,
          shiftKey: originalEvent.shiftKey,
          metaKey: originalEvent.metaKey,
          ctrlKey: originalEvent.ctrlKey,
          altKey: originalEvent.altKey,
          target: originalEvent.target,
          pageX: originalEvent.pageX,
          pageY: originalEvent.pageY,
        });
      }

      latestProps.current.onMove?.({
        type: "move",
        pointerType,
        deltaX: deltaX,
        deltaY: deltaY,
        shiftKey: originalEvent.shiftKey,
        metaKey: originalEvent.metaKey,
        ctrlKey: originalEvent.ctrlKey,
        altKey: originalEvent.altKey,
        pageX: originalEvent.pageX,
        pageY: originalEvent.pageY,
      });
    };
    let end = (originalEvent: EventBase, pointerType: PointerType) => {
      //restoreTextSelection();
      if (state.current.didMove) {
        latestProps.current.onMoveEnd?.({
          type: "moveend",
          pointerType,
          shiftKey: originalEvent.shiftKey,
          metaKey: originalEvent.metaKey,
          ctrlKey: originalEvent.ctrlKey,
          altKey: originalEvent.altKey,
        });
      }
    };

    if (typeof PointerEvent === "undefined") {
      let onMouseMove = (e: MouseEvent) => {
        if (e.button === 0 && state.current.lastPosition !== null) {
          move(
            e,
            "mouse",
            e.pageX - state.current.lastPosition.pageX,
            e.pageY - state.current.lastPosition.pageY
          );
          state.current.lastPosition = { pageX: e.pageX, pageY: e.pageY };
        }
      };
      let onMouseUp = (e: MouseEvent) => {
        if (e.button === 0) {
          end(e, "mouse");
          removeGlobalListener(window, "mousemove", onMouseMove, false);
          removeGlobalListener(window, "mouseup", onMouseUp, false);
        }
      };
      moveProps.onMouseDown = (e: React.MouseEvent) => {
        if (e.button === 0) {
          start();
          e.stopPropagation();
          e.preventDefault();
          state.current.lastPosition = { pageX: e.pageX, pageY: e.pageY };
          addGlobalListener(window, "mousemove", onMouseMove, false);
          addGlobalListener(window, "mouseup", onMouseUp, false);
        }
      };

      let onTouchMove = (e: TouchEvent) => {
        let touch = [...e.changedTouches].findIndex(
          ({ identifier }) => identifier === state.current.id
        );
        if (touch >= 0 && state.current.lastPosition !== null) {
          let { pageX, pageY } = e.changedTouches[touch];
          move(
            e,
            "touch",
            pageX - state.current.lastPosition.pageX,
            pageY - state.current.lastPosition.pageY
          );
          state.current.lastPosition = { pageX, pageY };
        }
      };
      let onTouchEnd = (e: TouchEvent) => {
        let touch = [...e.changedTouches].findIndex(
          ({ identifier }) => identifier === state.current.id
        );
        if (touch >= 0) {
          end(e, "touch");
          state.current.id = null;
          removeGlobalListener(window, "touchmove", onTouchMove);
          removeGlobalListener(window, "touchend", onTouchEnd);
          removeGlobalListener(window, "touchcancel", onTouchEnd);
        }
      };
      moveProps.onTouchStart = (e: React.TouchEvent) => {
        if (e.changedTouches.length === 0 || state.current.id != null) {
          return;
        }

        let { pageX, pageY, identifier } = e.changedTouches[0];
        start();
        e.stopPropagation();
        e.preventDefault();
        state.current.lastPosition = { pageX, pageY };
        state.current.id = identifier;
        addGlobalListener(window, "touchmove", onTouchMove, false);
        addGlobalListener(window, "touchend", onTouchEnd, false);
        addGlobalListener(window, "touchcancel", onTouchEnd, false);
      };
    } else {
      let onPointerMove = (e: PointerEvent) => {
        if (
          e.pointerId === state.current.id &&
          state.current.lastPosition !== null
        ) {
          let pointerType = (e.pointerType || "mouse") as PointerType;

          // Problems with PointerEvent#movementX/movementY:
          // 1. it is always 0 on macOS Safari.
          // 2. On Chrome Android, it's scaled by devicePixelRatio, but not on Chrome macOS
          move(
            e,
            pointerType,
            e.pageX - state.current.lastPosition.pageX,
            e.pageY - state.current.lastPosition.pageY
          );
          state.current.lastPosition = { pageX: e.pageX, pageY: e.pageY };
        }
      };

      let onPointerUp = (e: PointerEvent) => {
        if (e.pointerId === state.current.id) {
          let pointerType = (e.pointerType || "mouse") as PointerType;
          end(e, pointerType);
          state.current.id = null;
          removeGlobalListener(window, "pointermove", onPointerMove, false);
          removeGlobalListener(window, "pointerup", onPointerUp, false);
          removeGlobalListener(window, "pointercancel", onPointerUp, false);
        }
      };

      moveProps.onPointerDown = (e: React.PointerEvent) => {
        if (e.button === 0 && state.current.id == null) {
          start();
          e.stopPropagation();
          e.preventDefault();
          state.current.lastPosition = { pageX: e.pageX, pageY: e.pageY };
          state.current.id = e.pointerId;
          addGlobalListener(window, "pointermove", onPointerMove, false);
          addGlobalListener(window, "pointerup", onPointerUp, false);
          addGlobalListener(window, "pointercancel", onPointerUp, false);
        }
      };
    }

    let triggerKeyboardMove = (
      e: React.KeyboardEvent,
      deltaX: number,
      deltaY: number
    ) => {
      start();
      move(e, "keyboard", deltaX, deltaY);
      end(e, "keyboard");
    };

    moveProps.onKeyDown = (e) => {
      switch (e.key) {
        case "Left":
        case "ArrowLeft":
          e.preventDefault();
          e.stopPropagation();
          triggerKeyboardMove(e, -1, 0);
          break;
        case "Right":
        case "ArrowRight":
          e.preventDefault();
          e.stopPropagation();
          triggerKeyboardMove(e, 1, 0);
          break;
        case "Up":
        case "ArrowUp":
          e.preventDefault();
          e.stopPropagation();
          triggerKeyboardMove(e, 0, -1);
          break;
        case "Down":
        case "ArrowDown":
          e.preventDefault();
          e.stopPropagation();
          triggerKeyboardMove(e, 0, 1);
          break;
      }
    };

    return moveProps;
  }, [addGlobalListener, removeGlobalListener]);

  return { moveProps };
}
