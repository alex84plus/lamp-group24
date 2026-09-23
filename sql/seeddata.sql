USE `ContactManagerDB`;


-- Sample Users

INSERT INTO `Users` (`FirstName`, `LastName`, `Email, `Login`, `Password`, `Role`, `IsVerified`) VALUES
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
