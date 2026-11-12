CREATE TABLE PUBLISHER (
    publisher_id SERIAL PRIMARY KEY,
    publisher_name VARCHAR(100) NOT NULL,
    address TEXT,
    phone VARCHAR(15),
    email VARCHAR(100)
);


CREATE TABLE CATEGORY (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL,
    shelf_location VARCHAR(20)
);

CREATE TABLE BOOKS (
    book_id SERIAL PRIMARY KEY,
    isbn VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(150) NOT NULL,
    publisher_id INT REFERENCES PUBLISHER(publisher_id),
    category_id INT REFERENCES CATEGORY(category_id),
    publication_year INT
);

CREATE TABLE AUTHORS (
    author_id SERIAL PRIMARY KEY,
    author_name VARCHAR(100) NOT NULL,
    biography TEXT,
    email VARCHAR(100)
);

CREATE TABLE BOOK_AUTHORS (
    book_id INT REFERENCES BOOKS(book_id) ON DELETE CASCADE,
    author_id INT REFERENCES AUTHORS(author_id) ON DELETE CASCADE,
    PRIMARY KEY (book_id, author_id)
);

CREATE TABLE BOOK_COPIES (
    copy_id SERIAL PRIMARY KEY,
    book_id INT REFERENCES BOOKS(book_id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'Available' CHECK (status IN ('Available', 'Issued', 'Maintenance', 'Lost')),
    condition VARCHAR(50) DEFAULT 'Good'
);

CREATE TABLE MEMBERS (
    member_id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    member_type VARCHAR(20) CHECK (member_type IN ('Student', 'Faculty', 'Staff')),
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(15),
    join_date DATE DEFAULT CURRENT_DATE,
    max_issue_limit INT DEFAULT 5
);

CREATE TABLE STAFF (
    staff_id SERIAL PRIMARY KEY,
    staff_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    hire_date DATE DEFAULT CURRENT_DATE
);

CREATE TABLE ISSUE_RECORD (
    issue_id SERIAL PRIMARY KEY,
    copy_id INT REFERENCES BOOK_COPIES(copy_id),
    member_id INT REFERENCES MEMBERS(member_id),
    staff_id INT REFERENCES STAFF(staff_id),
    issue_date DATE DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    return_date DATE
);

CREATE TABLE FINES (
    fine_id SERIAL PRIMARY KEY,
    issue_id INT REFERENCES ISSUE_RECORD(issue_id),
    amount DECIMAL(10, 2) DEFAULT 0.00 NOT NULL,
    fine_date DATE DEFAULT CURRENT_DATE,
    payment_status VARCHAR(20) DEFAULT 'Unpaid' CHECK (payment_status IN ('Unpaid', 'Paid'))
);

CREATE TABLE RESERVATIONS (
    reservation_id SERIAL PRIMARY KEY,
    book_id INT REFERENCES BOOKS(book_id) ON DELETE CASCADE,
    member_id INT REFERENCES MEMBERS(member_id) ON DELETE CASCADE,
    reservation_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Fulfilled', 'Cancelled'))
);



INSERT INTO PUBLISHER (publisher_name,address,phone,email) VALUES
('Pearson Education','London, UK','1234567890','contact@pearson.com'),
('McGraw Hill','New York, USA','0987654321','support@mcgraw.com'),
('OReilly Media','California, USA','9876543210','info@oreilly.com'),
('Wiley','New Jersey, USA','8765432109','contact@wiley.com'),
('Springer','Berlin, Germany','7654321098','help@springer.com'),
('MIT Press','Massachusetts, USA','7001002001','info@mitpress.com'),
('Packt Publishing','Birmingham, UK','7001002002','support@packt.com'),
('Oxford Press','Oxford, UK','7001002003','contact@oup.com'),
('Cambridge Press','Cambridge, UK','7001002004','help@cup.com'),
('Elsevier','Amsterdam, Netherlands','7001002005','service@elsevier.com');

INSERT INTO CATEGORY(category_name,shelf_location) VALUES
('Computer Science','A1'),
('Mathematics','B1'),
('Physics','C1'),
('Electronics','D1'),
('Literature','E1'),
('Data Science','F1'),
('Artificial Intelligence','F2'),
('Networking','G1'),
('Cyber Security','G2'),
('Economics','H1');

INSERT INTO AUTHORS(author_name,biography,email) VALUES
('Dennis Ritchie','Creator of C Language','ritchie@email.com'),
('Brian Kernighan','Co-author of C Programming','kernighan@email.com'),
('Abraham Silberschatz','Database Expert','silber@email.com'),
('Thomas Cormen','Algorithms Author','cormen@email.com'),
('Robert Martin','Software Engineering Expert','unclebob@email.com'),
('Erwin Kreyszig','Mathematics Author','kreyszig@email.com'),
('Stephen Hawking','Physicist','hawking@email.com'),
('Paul Horowitz','Electronics Author','horowitz@email.com'),
('William Shakespeare','Playwright','william@email.com'),
('Bjarne Stroustrup','Creator of C++','bjarne@email.com'),
('Ian Goodfellow','AI Researcher','ian@email.com'),
('Andrew Ng','Machine Learning Expert','ng@email.com'),
('Kurose','Networking Author','kurose@email.com'),
('Ross','Database Author','ross@email.com'),
('Stallings','Security Author','stallings@email.com'),
('Narasimha Karumanchi','DSA Author','narasimha@email.com'),
('Herbert Schildt','Programming Author','schildt@email.com'),
('E Balagurusamy','Computer Science Author','bala@email.com'),
('Yashavant Kanetkar','Programming Author','kanetkar@email.com'),
('Joel Grus','Data Science Author','grus@email.com');


INSERT INTO BOOKS(isbn,title,publisher_id,category_id,publication_year) VALUES
('9780131103627','The C Programming Language',1,1,1988),
('9780073529240','Database System Concepts',2,1,2010),
('9780262033848','Introduction to Algorithms',3,1,2009),
('9780132350884','Clean Code',1,1,2008),
('9788120340077','Advanced Engineering Mathematics',4,2,2011),
('9780553380163','A Brief History of Time',5,3,1988),
('9781259007068','Digital Fundamentals',2,4,2015),
('9780198321668','Hamlet',4,5,1603),
('9780321563842','Effective C++',1,1,2005),
('9781119428110','Electronics Basics',4,4,2018),
('9781118008188','Artificial Intelligence',6,7,2016),
('9780136042594','Computer Networks',7,8,2018),
('9780078022159','Data Structures Using C',2,1,2015),
('9781260457654','Cyber Security Essentials',2,9,2020),
('9789352130165','Python Programming',1,1,2018),
('9780262035613','Deep Learning',6,7,2019),
('9781119457899','Data Science from Scratch',4,6,2021),
('9780134093413','Computer Architecture',4,1,2019),
('9780321992789','Cloud Computing',4,1,2020),
('9781849965323','Data Mining Concepts',5,6,2018);

INSERT INTO BOOK_AUTHORS(book_id,author_id) VALUES
(1,1),(1,2),
(2,3),
(3,4),
(4,5),
(5,6),
(6,7),
(7,8),
(8,9),
(9,10),
(10,8),
(11,11),
(12,13),
(13,16),
(14,15),
(15,19),
(16,12),
(17,20),
(18,10),
(19,5),
(20,20);

INSERT INTO STAFF(staff_name,role,email) VALUES
('Liam Clerk','Librarian','liam@library.edu'),
('Noah Admin','Assistant Librarian','noah@library.edu'),
('Olivia Brown','Library Manager','olivia@library.edu'),
('Sophia Taylor','Librarian','sophia@library.edu'),
('James Miller','Assistant','james@library.edu');

INSERT INTO MEMBERS(full_name,member_type,email,phone) VALUES
('Alice Smith','Student','alice@univ.edu','9000000001'),
('Bob Jones','Faculty','bob@univ.edu','9000000002'),
('Carol White','Student','carol@univ.edu','9000000003'),
('David Green','Faculty','david@univ.edu','9000000004'),
('Emma Brown','Student','emma@univ.edu','9000000005'),
('Frank Miller','Staff','frank@univ.edu','9000000006'),
('Grace Hall','Student','grace@univ.edu','9000000007'),
('Henry Scott','Student','henry@univ.edu','9000000008'),
('Ivy Turner','Faculty','ivy@univ.edu','9000000009'),
('Jack Wilson','Staff','jack@univ.edu','9000000010'),
('Aarav Patel','Student','aarav@univ.edu','9000000011'),
('Diya Shah','Student','diya@univ.edu','9000000012'),
('Rahul Joshi','Student','rahul@univ.edu','9000000013'),
('Sneha Gupta','Student','sneha@univ.edu','9000000014'),
('Vivek Kumar','Student','vivek@univ.edu','9000000015'),
('Ankit Singh','Faculty','ankit@univ.edu','9000000016'),
('Maya Roy','Faculty','maya@univ.edu','9000000017'),
('Pooja Jain','Faculty','pooja@univ.edu','9000000018'),
('Dev Patel','Student','dev@univ.edu','9000000019'),
('Aryan Mehta','Student','aryan@univ.edu','9000000020');

INSERT INTO BOOK_COPIES(book_id,status,condition)
SELECT
((g-1)%20)+1,
CASE
WHEN g%5=0 THEN 'Issued'
WHEN g%7=0 THEN 'Maintenance'
ELSE 'Available'
END,
'Good'
FROM generate_series(1,40) g;

INSERT INTO ISSUE_RECORD
(copy_id,member_id,staff_id,issue_date,due_date)
SELECT
((g-1)%40)+1,
((g-1)%20)+1,
((g-1)%5)+1,
CURRENT_DATE-(g*2),
CURRENT_DATE-(g*2)+14
FROM generate_series(1,30) g;

INSERT INTO FINES
(issue_id,amount,fine_date,payment_status)
SELECT
g,
g*10.00,
CURRENT_DATE-g,
CASE
WHEN g%2=0 THEN 'Paid'
ELSE 'Unpaid'
END
FROM generate_series(1,15) g;

INSERT INTO RESERVATIONS
(book_id,member_id,reservation_date,status)
SELECT
((g-1)%20)+1,
((g-1)%20)+1,
CURRENT_DATE-g,
CASE
WHEN g%3=0 THEN 'Fulfilled'
WHEN g%5=0 THEN 'Cancelled'
ELSE 'Pending'
END
FROM generate_series(1,25) g;