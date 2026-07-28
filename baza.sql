
CREATE DATABASE PicoBlazeSimulator CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

CREATE USER IF NOT EXISTS 'PicoUser'@'localhost' IDENTIFIED BY 'Pass123';

GRANT ALL PRIVILEGES on PicoBlazeSimulator.* to 'PicoUser'@'localhost';

FLUSH PRIVILEGES;

CREATE DATABASE IF NOT EXISTS assembler_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE assembler_db;

CREATE TABLE IF NOT EXISTS programs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS deleted_programs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    previous_id INT UNIQUE
);

-- dorade 27.07.2026

CREATE TABLE IF NOT EXISTS usernames (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username TEXT NOT NULL,
    passwordHash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS codes_belonging_to_users (
    id INT PRIMARY KEY,
    code TEXT NOT NULL
);


CREATE TABLE user_programs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    code TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_user_programs_user
        FOREIGN KEY (user_id)
        REFERENCES usernames(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

INSERT INTO user_programs (user_id, title, code)
VALUES
(
    1,
    'Zbrajanje registara',
    'LOAD s0, 01
LOAD s1, 02
ADD s0, s1'
),
(
    1,
    'Oduzimanje vrijednosti',
    'LOAD s0, 05
SUB s0, 01'
);

INSERT INTO user_programs (user_id, title, code)
VALUES
(
    2,
    'Test LED programa',
    'LOAD s0, FF
OUTPUT s0, 01'
);


SELECT
    user_programs.id,
    usernames.username,
    user_programs.title,
    user_programs.code,
    user_programs.created_at,
    user_programs.updated_at
FROM user_programs
INNER JOIN usernames
    ON usernames.id = user_programs.user_id
ORDER BY usernames.username, user_programs.title;

SELECT
    user_programs.id,
    user_programs.title,
    user_programs.code
FROM user_programs
INNER JOIN usernames
    ON usernames.id = user_programs.user_id
WHERE usernames.username = 'milan'
ORDER BY user_programs.id;

CREATE TABLE api_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash CHAR(64) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,

    CONSTRAINT fk_api_tokens_user
        FOREIGN KEY (user_id)
        REFERENCES usernames(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);