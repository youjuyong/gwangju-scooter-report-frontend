import { useState, useEffect, useRef } from 'react';

export function useDrag(isOpen: boolean) {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const isDragging = useRef(false);
    const dragStart = useRef({ x: 0, y: 0 });

    // 🎯 팝업이 움직일 수 있는 최대/최소 한계선을 저장할 변수
    const bounds = useRef({ minX: 0, maxX: 0, minY: 0, maxY: 0 });

    // 🎯 팝업창 자체의 크기를 측정하기 위한 Ref
    const popupRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = (e: React.MouseEvent) => {
        isDragging.current = true;
        dragStart.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        };

        // 🔥 [핵심] 마우스를 클릭하는 순간, .subarticle과 팝업창의 크기를 재서 이동 한계선을 계산합니다.
        const container = document.querySelector('.subarticle') || document.querySelector('.subnav.dashboardTop');
        if (container && popupRef.current) {
            const containerRect = container.getBoundingClientRect();
            const popupRect = popupRef.current.getBoundingClientRect();

            bounds.current = {
                // 현재 내 위치에서 (팝업창의 왼쪽 끝 - 컨테이너의 왼쪽 끝) 만큼만 더 갈 수 있음
                minX: position.x - (popupRect.left - containerRect.left),
                maxX: position.x + (containerRect.right - popupRect.right),
                minY: position.y - (popupRect.top - containerRect.top),
                maxY: position.y + (containerRect.bottom - popupRect.bottom),
            };
        }
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging.current) return;

            let newX = e.clientX - dragStart.current.x;
            let newY = e.clientY - dragStart.current.y;

            // 🔥 [핵심] 계산해둔 한계선(bounds)을 넘어가려고 하면 강제로 막아버립니다.
            if (document.querySelector('.subarticle') && popupRef.current) {
                newX = Math.max(bounds.current.minX, Math.min(newX, bounds.current.maxX));
                newY = Math.max(bounds.current.minY, Math.min(newY, bounds.current.maxY));
            }

            setPosition({ x: newX, y: newY });
        };

        const handleMouseUp = () => {
            isDragging.current = false;
        };

        if (isOpen) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) {
            setPosition({ x: 0, y: 0 });
        }
    }, [isOpen]);

    return {
        position,
        handleMouseDown,
        isDragging: isDragging.current,
        popupRef // 🎯 컴포넌트에서 쓸 수 있도록 리턴에 추가
    };
}