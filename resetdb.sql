
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
    `Login` VARCHAR(50) NOT NULL DEFAULT '',
    `Password` VARCHAR(50) NOT NULL DEFAULT '',
    PRIMARY KEY (`ID`),
    INDEX `idx_users_login` (`Login`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Contact Table
CREATE TABLE `Contacts` (
    `ID` INT NOT NULL AUTO_INCREMENT,
    `FirstName` VARCHAR(50) NOT NULL DEFAULT '',
    `LastName` VARCHAR(50) NOT NULL DEFAULT '',
    `UserID` INT NOT NULL DEFAULT 0,
    `Phone` VARCHAR(25),
    `Email` VARCHAR(100),
    PRIMARY KEY (`ID`),
    INDEX `idx_contacts_userid` (`UserID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Sample Users
INSERT INTO `Users` (`FirstName`, `LastName`, `Login`, `Password`) VALUES

('Trajan', 'Jho', 'TJ', 'HLYF'),

('Caedmon', 'Clover', 'Caed', 'cacapao'),

('Liam', 'Kelly', 'SuperFish', '1luvZomboidz'),

('Bailey', 'Brown', 'Speaker', '1luvSOT');

-- Sample Contacts for User 1 (Trajan Jho)

INSERT INTO `Contacts` (`UserID`, `FirstName`, `LastName`, `Phone`, `Email`) VALUES

(1, 'Sona', 'Jho', '407-111-1234', 'sona@mail.com'),
(1, 'Harry', 'Jho', '407-222-1734', 'harry@mail.com'),
(1, 'Alex', 'Jho', '407-333-9564', 'alex@mail.com');

-- Sample Contacts for User 2 (Caedmon Clover)

INSERT INTO `Contacts` (`UserID`, `FirstName`, `LastName`, `Phone`, `Email`) VALUES

(2, 'Anthony', 'Gator', '407-444-2754', 'anthony@mail.com'),
(2, 'Gwen', 'Deer', '407-555-7444', 'gwen@mail.com'),
(2, 'Alex', 'Squirrel', '407-666-0563', 'alex@mail.com'),
(2, 'Sam', 'Cat', '407-777-2400', 'sam@mail.com');

-- Create Application Database User & Privileges
CREATE USER IF NOT EXISTS 'DBuser'@'localhost' IDENTIFIED BY 'WeLoveCOP4331!';
GRANT ALL PRIVILEGES ON `ContactManagerDB`.* TO 'DBuser'@'localhost';

CREATE USER IF NOT EXISTS 'DBuser'@'%' IDENTIFIED BY 'WeLoveCOP4331!';
GRANT ALL PRIVILEGES ON `ContactManagerDB`.* TO 'DBuser'@'%';

FLUSH PRIVILEGES;
