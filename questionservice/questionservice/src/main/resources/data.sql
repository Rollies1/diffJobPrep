-- Insert Categories (only if they don't exist)
INSERT INTO categories (name, description)
SELECT 'Software Engineering', 'Questions related to software development, coding, and engineering principles'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Software Engineering');

INSERT INTO categories (name, description)
SELECT 'Networking', 'Questions related to computer networks, protocols, and infrastructure'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Networking');

INSERT INTO categories (name, description)
SELECT 'Cybersecurity', 'Questions related to security, encryption, and threat management'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Cybersecurity');

-- Insert Questions for Software Engineering (category_id = 1)
INSERT INTO questions (category_id, question, sample_answer, difficulty)
SELECT 1, 'What is the difference between an abstract class and an interface in Java?',
'An abstract class can have both abstract and concrete methods and can maintain state through instance variables. An interface defines a contract with only abstract methods prior to Java 8 and cannot maintain state. A class can implement multiple interfaces but can only extend one abstract class.',
'MEDIUM'
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE question = 'What is the difference between an abstract class and an interface in Java?');

INSERT INTO questions (category_id, question, sample_answer, difficulty)
SELECT 1, 'What is Object Oriented Programming?',
'OOP is a programming paradigm based on objects which contain data and code. The four pillars are encapsulation, inheritance, polymorphism, and abstraction.',
'EASY'
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE question = 'What is Object Oriented Programming?');

INSERT INTO questions (category_id, question, sample_answer, difficulty)
SELECT 1, 'Explain the SOLID principles.',
'SOLID stands for Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion principles. They guide writing maintainable and scalable code.',
'HARD'
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE question = 'Explain the SOLID principles.');

INSERT INTO questions (category_id, question, sample_answer, difficulty)
SELECT 1, 'What is a REST API?',
'REST is an architectural style for designing networked applications. It uses HTTP methods like GET, POST, PUT, DELETE to perform CRUD operations. REST APIs are stateless and return data in JSON or XML format.',
'EASY'
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE question = 'What is a REST API?');

INSERT INTO questions (category_id, question, sample_answer, difficulty)
SELECT 1, 'What is the difference between SQL and NoSQL databases?',
'SQL databases are relational and use structured tables and fixed schemas. NoSQL databases are non-relational with flexible schema and handle unstructured data. SQL is used for complex queries while NoSQL scales better horizontally.',
'MEDIUM'
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE question = 'What is the difference between SQL and NoSQL databases?');

-- Insert Questions for Networking (category_id = 2)
INSERT INTO questions (category_id, question, sample_answer, difficulty)
SELECT 2, 'What is the difference between TCP and UDP?',
'TCP is connection-oriented and guarantees delivery of packets in order. UDP is connectionless and faster but does not guarantee delivery. TCP is used for web browsing and email while UDP is used for video streaming and gaming.',
'EASY'
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE question = 'What is the difference between TCP and UDP?');

INSERT INTO questions (category_id, question, sample_answer, difficulty)
SELECT 2, 'What is the OSI model?',
'The OSI model is a conceptual framework with 7 layers: Physical, Data Link, Network, Transport, Session, Presentation, and Application. Each layer handles specific network functions.',
'MEDIUM'
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE question = 'What is the OSI model?');

INSERT INTO questions (category_id, question, sample_answer, difficulty)
SELECT 2, 'What is DNS and how does it work?',
'DNS translates human-readable domain names into IP addresses. When you type a URL your computer queries a DNS server which returns the corresponding IP address allowing your browser to connect to the correct server.',
'EASY'
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE question = 'What is DNS and how does it work?');

INSERT INTO questions (category_id, question, sample_answer, difficulty)
SELECT 2, 'What is the difference between a hub, switch, and router?',
'A hub broadcasts data to all devices on a network. A switch sends data only to the intended device using MAC addresses. A router connects different networks and directs traffic between them using IP addresses.',
'MEDIUM'
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE question = 'What is the difference between a hub, switch, and router?');

INSERT INTO questions (category_id, question, sample_answer, difficulty)
SELECT 2, 'What is subnetting?',
'Subnetting divides a large network into smaller sub-networks to improve performance and security. It uses subnet masks to define network and host portions of an IP address reducing broadcast traffic and improving organization.',
'HARD'
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE question = 'What is subnetting?');

-- Insert Questions for Cybersecurity (category_id = 3)
INSERT INTO questions (category_id, question, sample_answer, difficulty)
SELECT 3, 'What is a SQL injection attack?',
'SQL injection is a code injection technique where malicious SQL statements are inserted into input fields to manipulate the database. Prevention includes using prepared statements and input validation.',
'MEDIUM'
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE question = 'What is a SQL injection attack?');

INSERT INTO questions (category_id, question, sample_answer, difficulty)
SELECT 3, 'What is the difference between symmetric and asymmetric encryption?',
'Symmetric encryption uses the same key for encryption and decryption. Asymmetric encryption uses a public key for encryption and a private key for decryption. RSA is asymmetric while AES is symmetric.',
'HARD'
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE question = 'What is the difference between symmetric and asymmetric encryption?');

INSERT INTO questions (category_id, question, sample_answer, difficulty)
SELECT 3, 'What is two-factor authentication?',
'Two-factor authentication adds a second layer of security by requiring something you know such as a password and something you have such as a phone or token. Even if a password is stolen the account remains protected.',
'EASY'
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE question = 'What is two-factor authentication?');

INSERT INTO questions (category_id, question, sample_answer, difficulty)
SELECT 3, 'What is a man-in-the-middle attack?',
'A man-in-the-middle attack occurs when an attacker secretly intercepts and relays communication between two parties who believe they are communicating directly. Prevention includes using HTTPS, VPNs, and certificate validation.',
'MEDIUM'
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE question = 'What is a man-in-the-middle attack?');

INSERT INTO questions (category_id, question, sample_answer, difficulty)
SELECT 3, 'What is penetration testing?',
'Penetration testing is an authorized simulated cyberattack on a system to identify vulnerabilities before malicious hackers do. It involves reconnaissance, scanning, exploitation, and reporting to help organizations improve their security posture.',
'HARD'
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE question = 'What is penetration testing?');