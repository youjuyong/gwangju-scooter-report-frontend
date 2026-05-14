import { memo } from "react";
import { Polyline } from "react-kakao-maps-sdk";

export const CityOutline = memo(({ path }: { path: { lat: number; lng: number }[] }) => {
    return (
        <Polyline
            path={path}
            strokeWeight={3}
            strokeColor={"#2524FF"}
            strokeOpacity={0.9}
            strokeStyle={"shortdash"}
            zIndex={1}
        />
    );
}, (prev, next) => prev.path.length === next.path.length);