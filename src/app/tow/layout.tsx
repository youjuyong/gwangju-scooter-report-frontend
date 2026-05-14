import { Metadata } from "next";
import "../../css/pm_base_style.css"; // 경로에 맞춰 임포트
import "../../css/pm_style.css";

export const metadata: Metadata = {
  manifest: "/manifest-tow.json",
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {

    return (
        <>
            {children}
        </>
    );
}
