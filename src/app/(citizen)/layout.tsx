
import "../../assets/style/css/base_style.css"; // 경로에 맞춰 임포트
import "../../assets/style/css/style.css";

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
