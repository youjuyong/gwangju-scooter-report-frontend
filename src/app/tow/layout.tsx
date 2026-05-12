import "../../css/pm_base_style.css"; // 경로에 맞춰 임포트
import "../../css/pm_style.css";

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
