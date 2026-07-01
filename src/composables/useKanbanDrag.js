import { onUnmounted, ref } from 'vue';

const DRAG_THRESHOLD_PX = 6;

export function useKanbanDrag({ onMove }) {
    const draggingId = ref(null);
    const dropTargetKey = ref(null);
    const suppressClick = ref(false);

    let payload = null;
    let startX = 0;
    let startY = 0;
    let active = false;
    let onPointerMove = null;
    let onPointerUp = null;

    function cleanup() {
        document.body.classList.remove('roadmap-dragging');
        draggingId.value = null;
        dropTargetKey.value = null;
        payload = null;
        active = false;

        if (onPointerMove) {
            window.removeEventListener('pointermove', onPointerMove);
            onPointerMove = null;
        }

        if (onPointerUp) {
            window.removeEventListener('pointerup', onPointerUp);
            onPointerUp = null;
        }
    }

    function findDropZone(clientX, clientY) {
        const element = document.elementFromPoint(clientX, clientY);
        return element?.closest('[data-drop-zone]') ?? null;
    }

    function updateDropTarget(clientX, clientY) {
        const zone = findDropZone(clientX, clientY);
        dropTargetKey.value = zone?.dataset.zoneKey ?? null;
    }

    function onPointerDown(event, itemPayload) {
        if (event.button !== 0) return;
        if (event.target.closest('[data-no-drag]')) return;

        payload = itemPayload;
        startX = event.clientX;
        startY = event.clientY;
        active = false;

        onPointerMove = (moveEvent) => {
            if (!payload) return;

            const dx = moveEvent.clientX - startX;
            const dy = moveEvent.clientY - startY;

            if (!active) {
                if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
                active = true;
                draggingId.value = payload.id;
                document.body.classList.add('roadmap-dragging');
            }

            updateDropTarget(moveEvent.clientX, moveEvent.clientY);
        };

        onPointerUp = async (upEvent) => {
            if (!payload) {
                cleanup();
                return;
            }

            try {
                if (active) {
                    const zone = findDropZone(upEvent.clientX, upEvent.clientY);
                    if (zone) {
                        const moved = await onMove(payload, zone);
                        if (moved) suppressClick.value = true;
                    }
                }
            } finally {
                cleanup();
            }
        };

        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
    }

    onUnmounted(cleanup);

    return {
        draggingId,
        dropTargetKey,
        suppressClick,
        onPointerDown
    };
}
