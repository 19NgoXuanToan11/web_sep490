import React from "react";
import styles from "./Calendar.module.scss";

interface Props {
    onPrev: () => void;
    onNext: () => void;
    onToday: () => void;
    label: string;
}

export const Header: React.FC<Props> = ({ onPrev, onNext, onToday, label }) => {
    return (
        <div className={styles.header}>
            <div className={styles.controls}>
                <button className={`${styles.btn} ${styles.primary}`} onClick={onToday}>Hôm nay</button>
            </div>
            <div className={styles.label}>{label}</div>
            <div className={styles.controls}>
                <button
                    className={styles.navBtn}
                    onClick={onPrev}
                    aria-label="Tháng trước"
                    title="Tháng trước"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>

                <button
                    className={styles.navBtn}
                    onClick={onNext}
                    aria-label="Tháng sau"
                    title="Tháng sau"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default Header;


