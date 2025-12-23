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
                <button className={styles.btn} onClick={onPrev}>◀</button>
                <button className={styles.btn} onClick={onNext}>▶</button>
            </div>
        </div>
    );
};

export default Header;


