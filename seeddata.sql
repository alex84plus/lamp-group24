USE `ContactManagerDB`;


-- Sample Users

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