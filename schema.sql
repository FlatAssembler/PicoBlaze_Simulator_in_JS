CREATE DATABASE assembler_db;
USE assembler_db;

CREATE TABLE programs (
    /* use UUID instead of INT AUTO_INCREMENT ? */
    id INT AUTO_INCREMENT PRIMARY KEY,
    code TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);