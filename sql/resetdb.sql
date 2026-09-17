
-- Create and select database
CREATE DATABASE IF NOT EXISTS `ContactManagerDB`
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE `ContactManagerDB`;

-- Drop existing tables to ensure a clean state
DROP TABLE IF EXISTS `Contacts`;
DROP TABLE IF EXISTS `Users`;

-- Create Users Table
CREATE TABLE `Users` (
    `ID` INT NOT NULL AUTO_INCREMENT,
    `FirstName` VARCHAR(50) NOT NULL DEFAULT '',
    `LastName` VARCHAR(50) NOT NULL DEFAULT '',
    `Email` VARCHAR(100) NOT NULL DEFAULT '',
    `Login` VARCHAR(50) NOT NULL DEFAULT '',
    `Password` VARCHAR(255) NOT NULL DEFAULT '',
    `Role` VARCHAR(10) NOT NULL DEFAULT 'USER',
    `IsDisabled` BOOLEAN NOT NULL DEFAULT FALSE,
    `Created` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `Updated` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `IsVerified` BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (`ID`),
    INDEX `idx_users_login` (`Login`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Contact Table
CREATE TABLE `Contacts` (
    `ID` INT NOT NULL AUTO_INCREMENT,
    `FirstName` VARCHAR(50) NOT NULL DEFAULT '',
    `LastName` VARCHAR(50) NOT NULL DEFAULT '',
    `UserID` INT NOT NULL,
    `Phone` VARCHAR(25),
    `Email` VARCHAR(100),
    `Created` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `Updated` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`ID`),
    INDEX `idx_contacts_userid` (`UserID`),
    FOREIGN KEY (`UserID`)
        REFERENCES Users(`ID`)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Sample Users
INSERT INTO `Users` (`FirstName`, `LastName`, `Email`, `Login`, `Password`, `Role`, `IsVerified`) VALUES
  -- Default Admin Account
('Application', 'Administrator', 'admin@monkeymail.com', 'root', 'admin67', 'Admin', TRUE), 

('Trajan', 'Jho', 'dummy2@monkeymail.com', 'TJ', 'HLYF', 'User', TRUE),

('Caedmon', 'Clover', 'dummy3@monkeymail.com', 'Caed', 'cacapao', 'User', TRUE),

('Liam', 'Kelly', 'dummy4@monkeymail.com', 'SuperFish', '1luvZomboidz', 'User', TRUE),

('Bailey', 'Brown', 'dummy5@monkeymail.com', 'Speaker', '1luvSOT', 'User', TRUE);

-- Sample Contacts for User 1 (Trajan Jho)

INSERT INTO `Contacts` (`UserID`, `FirstName`, `LastName`, `Phone`, `Email`) VALUES

(2, 'Sona', 'Jho', '407-111-1234', 'sona@mail.com'),
(2, 'Harry', 'Jho', '407-222-1734', 'harry@mail.com'),
(2, 'Alex', 'Jho', '407-333-9564', 'alex@mail.com');

-- Sample Contacts for User 2 (Caedmon Clover)

INSERT INTO `Contacts` (`UserID`, `FirstName`, `LastName`, `Phone`, `Email`) VALUES

(3, 'Anthony', 'Gator', '407-444-2754', 'anthony@mail.com'),
(3, 'Gwen', 'Deer', '407-555-7444', 'gwen@mail.com'),
(3, 'Alex', 'Squirrel', '407-666-0563', 'alex@mail.com'),
(3, 'Sam', 'Cat', '407-777-2400', 'sam@mail.com');

-- Create Application Database User & Privileges
CREATE USER IF NOT EXISTS 'DBuser'@'localhost' IDENTIFIED BY 'WeLoveCOP4331!';
GRANT ALL PRIVILEGES ON `ContactManagerDB`.* TO 'DBuser'@'localhost';

CREATE USER IF NOT EXISTS 'DBuser'@'%' IDENTIFIED BY 'WeLoveCOP4331!';
GRANT ALL PRIVILEGES ON `ContactManagerDB`.* TO 'DBuser'@'%';

FLUSH PRIVILEGES;
