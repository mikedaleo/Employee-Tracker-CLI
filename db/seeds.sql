INSERT INTO department (name)
    VALUES 
        ('Pick'),
        ('Stow'),
        ('AFE1'),
        ('AFE2'),
        ('Ship Dock');

INSERT INTO role (title, salary, department_id)
    VALUES
        ('PA', 45000, 1),
        ('Stower', 35000, 2),
        ('Packer', 35000, 3),
        ('Sorter', 35000, 4),
        ('Flat Sorter', 35000, 5),
        ('Manager', 55000, 1);

INSERT INTO employee (first_name, last_name, role_id)
    VALUES
        ('Michael', 'Daleo', 1),
        ('Jim', 'Jones', 2),
        ('Ryan', 'Smith', 3),
        ('George', 'Kong', 4),
        ('Lisa', 'Lee', 5),
        ('Amanda', 'Mesina', 6);

