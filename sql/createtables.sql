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
    `Created` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `Updated` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
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
    `Created` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `Updated` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`ID`),
    INDEX `idx_contacts_userid` (`UserID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create dedicated application database user

CREATE USER IF NOT EXISTS 'DBuser'@'localhost' IDENTIFIED BY 'WeLoveCOP4331!';


-- Grant privileges only on ContactManagerDB

GRANT ALL PRIVILEGES ON `ContactManagerDB`.* TO 'DBuser'@'localhost';


-- Also permit remote connection if needed for Docker containerization

CREATE USER IF NOT EXISTS `DBuser`@`%` IDENTIFIED BY 'WeLoveCOP4331!';

GRANT ALL PRIVILEGES ON `ContactManagerDB`.* TO `DBuser`@`%`;


FLUSH PRIVILEGES;
