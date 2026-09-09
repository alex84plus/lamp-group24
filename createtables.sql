-- 1. Create the Database with utf8mb4 encoding

CREATE DATABASE IF NOT EXISTS `ContactManagerDB`

    DEFAULT CHARACTER SET utf8mb4

    DEFAULT COLLATE utf8mb4_unicode_ci;


USE `ContactManagerDB`;


-- 2. Create Users Table

CREATE TABLE IF NOT EXISTS `Users` (

    `ID` INT NOT NULL AUTO_INCREMENT,

    `FirstName` VARCHAR(50) NOT NULL DEFAULT '',

    `LastName` VARCHAR(50) NOT NULL DEFAULT '',

    `Login` VARCHAR(50) NOT NULL DEFAULT '',

    `Password` VARCHAR(50) NOT NULL DEFAULT '',

    PRIMARY KEY (`ID`),

    INDEX `idx_users_login` (`Login`)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `Contacts` (

    `ID` INT NOT NULL AUTO_INCREMENT,

    `UserID` INT NOT NULL,

    `FirstName` VARCHAR(50) NOT NULL DEFAULT '',

    `LastName` VARCHAR(50) NOT NULL DEFAULT '',

    `Phone` VARCHAR(25),

    `Email` VARCHAR(100),

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