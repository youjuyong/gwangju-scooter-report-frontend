import { Metadata } from "next";
import "../../assets/style_pm/css/base_style.css"; // 경로에 맞춰 임포트
import "../../assets/style_pm/css/style.css";

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
