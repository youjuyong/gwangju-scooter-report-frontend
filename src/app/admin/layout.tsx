import {Metadata} from "next";
import "../../assets/style_admin/css/base_style.css"; // 경로에 맞춰 임포트
import "../../assets/style_admin/css/style.css";
import "../../assets/style_admin/css/m_style.css";

export const metadata: Metadata = {
    manifest: "/manifest-admin.json",
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
