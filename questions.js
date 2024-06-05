const inquirer = require('inquirer');
const { Pool } = require('pg');
const { consoleTable } = require('js-awe');
require('dotenv').config();


const pool = new Pool(
    {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: 'localhost',
        database: process.env.DB_NAME
    },
    console.log('Connected to the employees_db database.')
    
)
pool.connect();

const getDepartmentNames = () => {
    return new Promise((resolve, reject) => {
        pool.query('SELECT * FROM department', (err, { rows }) => {
            if (err) {
                console.error(err.message);
                reject(err);
            }

            resolve(rows);
        });
    });
};

const getRoles = () => {
    return new Promise((resolve, reject) => {
        pool.query('SELECT role.id AS role_id, role.title, role.salary, role.department_id, employee.id AS employee_id, employee.first_name, employee.last_name, employee.role_id AS employee_role_id, employee.manager_id FROM role LEFT JOIN employee ON role.id = employee.role_id', (err, { rows }) => {
            if (err) {
                console.error(err.message);
                reject(err);
            }
            resolve(rows);
        });
    });
};

const questions = () => {
    inquirer
        .prompt([
            {
                type: 'list',
                name: 'start',
                message: 'What would you like to do?',
                choices: ['View All Departments', 'View All Roles', 'View All Employees', 'Add Department', 'Add Role', 'Add Employee', 'Update Employee Role', 'Update Employee Manager', 'View Employees by Manager', 'View Employees by Department', 'Delete Department', 'Delete Role', 'Delete Employee', 'View Total Utilized Budget of Department'],
            },
        ])
        .then((answers) => {
            if (answers.start === 'View All Departments') {
                pool.query(`SELECT * FROM department`, (err, { rows }) => {
                    if (err) {
                        console.log('Error viewing departments:', err);
                    } else {
                        consoleTable(rows);
                        questions();
                    }
                });
            } else if (answers.start === 'View All Roles') {
                pool.query(`SELECT role.id, title, department.name AS department, salary FROM role JOIN department ON role.department_id = department.id`, (err, { rows }) => {
                    if (err) {
                        console.log('Error viewing roles:', err);
                    } else {
                        consoleTable(rows);
                        questions();
                    }
                });
            } else if (answers.start === 'View All Employees') {
                pool.query(`SELECT employee.id, employee.first_name, employee.last_name, role.title, department.name AS department, role.salary, CONCAT(m.first_name, ' ', m.last_name) AS manager FROM employee JOIN role ON employee.role_id = role.id JOIN department
                    ON department.id = role.department_id LEFT JOIN employee m ON employee.manager_id = m.id`, (err, { rows }) => {
                    if (err) {
                        console.log('Error viewing employees:', err);
                    } else {
                        consoleTable(rows);
                        questions();
                    }
                });
            } else if (answers.start === 'Add Department') {
                inquirer.prompt([
                    {
                        type: 'input',
                        name: 'department',
                        message: 'What is the name of the department?',
                    },
                ])
                    .then((answers) => {
                        const queryText = 'INSERT INTO department(name) VALUES($1)';
                        pool.query(queryText, [answers.department], (err) => {
                            if (err) {
                                console.log('Error adding department:', err);
                            } else {
                                console.log(`Added ${answers.department} to the database`);
                            }
                            questions();
                        });
                    });


            } else if (answers.start === 'Add Role') {
                getDepartmentNames()

                    .then((data) => {
                        const departments = data.map(department => ({ name: department.name, value: department.id }));
                        inquirer.prompt([
                            {
                                type: 'input',
                                name: 'role',
                                message: 'What is the name of the role?',
                            },
                            {
                                type: 'input',
                                name: 'roleSalary',
                                message: 'What is the salary of the role?',
                            },
                            {
                                type: 'list',
                                name: 'roleDepartment',
                                message: 'Which department does the role belong to?',
                                choices: departments,
                            }
                        ])
                            .then((answers) => {
                                const queryText = 'INSERT INTO role(title, salary, department_id) VALUES($1, $2, $3)';
                                pool.query(queryText, [answers.role, answers.roleSalary, answers.roleDepartment], (err) => {
                                    if (err) {
                                        console.log('Error adding role:', err);
                                    } else {
                                        console.log(`Added ${answers.role} to the database`);
                                    }
                                    questions();
                                });
                            });
                    })
                    .catch((error) => {
                        console.error('Error getting department names:', error);
                    });

            } else if (answers.start === 'Add Employee') {
                getRoles()
                    .then((data) => {
                        const uniqueRoles = data.reduce((unique, role) => {

                            if (!unique.some(obj => obj.value === role.role_id)) {
                                unique.push({ name: role.title, value: role.role_id });
                            }
                            return unique;
                        }, []);
                        const managers = data.filter(employee => employee.role_id === 6);
                        const managerChoice = [{
                            name: 'None', value: null
                        }, ...managers.map(manager => ({ name: `${manager.first_name} ${manager.last_name}`, value: manager.employee_id }))];

                        inquirer.prompt([
                            {
                                type: 'input',
                                name: 'firstName',
                                message: `What is the employee's first name?`,
                            },
                            {
                                type: 'input',
                                name: 'lastName',
                                message: `What is the employee's last name?`,
                            },
                            {
                                type: 'list',
                                name: 'employeeRole',
                                message: `What is the employee's role?`,
                                choices: uniqueRoles,
                            },
                            {
                                type: 'list',
                                name: 'employeeManager',
                                message: `Who is the employee's manager?`,
                                choices: managerChoice,
                            },
                        ])
                            .then((answers) => {
                                const queryText = 'INSERT INTO employee(first_name, last_name, role_id, manager_id) VALUES($1, $2, $3, $4)';
                                pool.query(queryText, [answers.firstName, answers.lastName, answers.employeeRole, answers.employeeManager], (err) => {
                                    if (err) {
                                        console.log('Error adding role:', err);
                                    } else {
                                        console.log(`Added ${answers.firstName} ${answers.lastName} to the database`);
                                    }
                                    questions();
                                });
                            });
                    })
                    .catch((error) => {
                        console.error('Error adding employee:', error);
                    });

            } else if (answers.start === 'Update Employee Role') {
                getRoles()
                    .then((data) => {
                        const filteredEmployees = data.filter(employee => employee.employee_id !== null)

                        const employeeChoice = filteredEmployees.map(employee => ({ name: `${employee.first_name} ${employee.last_name}`, value: employee.employee_id }));


                        const uniqueRoles = data.reduce((unique, role) => {

                            if (!unique.some(obj => obj.value === role.role_id)) {
                                unique.push({ name: role.title, value: role.role_id });
                            }
                            return unique;
                        }, []);

                        inquirer.prompt([
                            {
                                type: 'list',
                                name: 'employeeSelect',
                                message: `Which employee's role do you want to update?`,
                                choices: employeeChoice,
                            },
                            {
                                type: 'list',
                                name: 'employeeUpdatedRole',
                                message: 'Which role do you want to assign to the selected employee?',
                                choices: uniqueRoles,
                            },
                        ])
                            .then((answers) => {
                                const queryText = 'UPDATE employee SET role_id = $1 WHERE id = $2'
                                pool.query(queryText, [answers.employeeUpdatedRole, answers.employeeSelect], (err) => {
                                    if (err) {
                                        console.log('Error updating employee role:', err);
                                    } else {
                                        console.log(`Updated employee's role`);
                                    }
                                    questions();
                                })
                            })
                    })
                    .catch((error) => {
                        console.error('Error updating employee role:', error);
                    });
            } else if (answers.start === 'Update Employee Manager') {
                getRoles()
                    .then((data) => {
                        const filteredEmployees = data.filter(employee => employee.employee_id !== null)
                        const employeeChoice = filteredEmployees.map(employee => ({ name: `${employee.first_name} ${employee.last_name}`, value: employee.employee_id }));
                        const managers = data.filter(employee => employee.role_id === 6);
                        const managerChoice = [{
                            name: 'None', value: null
                        }, ...managers.map(manager => ({ name: `${manager.first_name} ${manager.last_name}`, value: manager.employee_id }))];
                        inquirer.prompt([
                            {
                                type: 'list',
                                name: 'employeeSelect',
                                message: `Which employee's manager do you want to update?`,
                                choices: employeeChoice,
                            },
                            {
                                type: 'list',
                                name: 'employeeUpdatedManager',
                                message: `Which manager do you want to assign to the selected employee?`,
                                choices: managerChoice,
                            },
                        ])
                            .then((answers) => {
                                const queryText = 'UPDATE employee SET manager_id = $1 WHERE id = $2'
                                pool.query(queryText, [answers.employeeUpdatedManager, answers.employeeSelect], (err) => {
                                    if (err) {
                                        console.log('Error updating employee manager:', err);
                                    } else {
                                        console.log(`Updated employee's manager`);
                                    }
                                    questions();
                                })
                            })
                    })
                    .catch((error) => {
                        console.error('Error updating employee manager:', error);
                    });
            } else if (answers.start === 'View Employees by Manager') {
                getRoles()
                    .then((data) => {
                        const managers = data.filter(employee => employee.role_id === 6);
                        const managerChoice = [{
                            name: 'None', value: null
                        }, ...managers.map(manager => ({ name: `${manager.first_name} ${manager.last_name}`, value: manager.employee_id }))];
                        inquirer.prompt([
                            {
                                type: 'list',
                                name: 'managerSelect',
                                message: `Which manager's employees would you like to view?`,
                                choices: managerChoice,
                            }
                        ])
                            .then((answers) => {
                                const selectedManager = managers.find(manager => manager.employee_id === answers.managerSelect);

                                const queryText = `SELECT employee.id, employee.first_name, employee.last_name, role.title, department.name AS department, role.salary, CONCAT(m.first_name, ' ', m.last_name) AS manager FROM employee JOIN role ON employee.role_id = role.id JOIN department
                                    ON department.id = role.department_id LEFT JOIN employee m ON employee.manager_id = m.id WHERE employee.manager_id = $1`;

                                pool.query(queryText, [answers.managerSelect], (err, { rows }) => {
                                    if (err) {
                                        console.log('Error viewing employees:', err);
                                    } else {
                                        console.log(`Viewing employees under ${selectedManager.first_name} ${selectedManager.last_name}`);
                                    }
                                    consoleTable(rows);
                                    questions();
                                })
                            })
                    })
                    .catch((error) => {
                        console.error('Error viewing employees:', error);
                    });

            } else if (answers.start === 'View Employees by Department') {
                getDepartmentNames()
                    .then((data) => {
                        const departments = data.map(department => ({ name: department.name, value: department.id }));
                        inquirer.prompt([
                            {
                                type: 'list',
                                name: 'department',
                                message: `Which department's employees would you like to view?`,
                                choices: departments,
                            },
                        ])
                            .then((answers) => {
                                const selectedDepartment = departments.find(department => department.id === answers.departmentSelect);

                                const queryText = `SELECT employee.id, employee.first_name, employee.last_name, role.title, department.name AS department, role.salary, CONCAT(m.first_name, ' ', m.last_name) AS manager FROM employee JOIN role ON employee.role_id = role.id JOIN department
                                    ON department.id = role.department_id LEFT JOIN employee m ON employee.manager_id = m.id WHERE department.id = $1`;

                                pool.query(queryText, [answers.department], (err, { rows }) => {
                                    if (err) {
                                        console.log('Error viewing employees:', err);
                                    } else {
                                        console.log(`Viewing employees in ${selectedDepartment.name} department`);
                                    }
                                    consoleTable(rows);
                                    questions();
                                })
                            })
                    })
                    .catch((error) => {
                        console.error('Error viewing employees:', error);
                    });
            } else if (answers.start === 'Delete Department') {
                getDepartmentNames()
                    .then((data) => {
                        const departments = data.map(department => ({ name: department.name, value: department.id }));

                        inquirer.prompt([
                            {
                                type: 'list',
                                name: 'department',
                                message: 'Which department would you like to delete?',
                                choices: departments,
                            },
                        ])
                            .then((answers) => {
                                const queryText = 'DELETE FROM department WHERE id = $1';
                                pool.query(queryText, [answers.department], (err) => {
                                    if (err) {
                                        console.log('Error deleting department:', err);
                                    } else {
                                        console.log(`Deleted department from the database`);
                                    }
                                    questions();
                                })

                            })
                    })
                    .catch((error) => {
                        console.error('Error deleting department:', error);
                    });
            } else if (answers.start === 'Delete Role') {
                getRoles()
                    .then((data) => {
                        const uniqueRoles = data.reduce((unique, role) => {

                            if (!unique.some(obj => obj.value === role.role_id)) {
                                unique.push({ name: role.title, value: role.role_id });
                            }
                            return unique;
                        }, [])
                        inquirer.prompt([
                            {
                                type: 'list',
                                name: 'role',
                                message: 'Which role would you like to delete?',
                                choices: uniqueRoles,
                            },
                        ])
                            .then((answers) => {
                                const queryText = 'DELETE FROM role WHERE id = $1';
                                pool.query(queryText, [answers.role], (err) => {
                                    if (err) {
                                        console.log('Error deleting role:', err);
                                    } else {
                                        console.log(`Deleted role from the database`);
                                    }
                                    questions();
                                })
                            })
                    })
                    .catch((error) => {
                        console.error('Error deleting role:', error);
                    });
            } else if (answers.start === 'Delete Employee') {
                getRoles()
                    .then((data) => {
                        const filteredEmployees = data.filter(employee => employee.employee_id !== null)
                        const employeeChoice = filteredEmployees.map(employee => ({ name: `${employee.first_name} ${employee.last_name}`, value: employee.employee_id }));
                        inquirer.prompt([
                            {
                                type: 'list',
                                name: 'employee',
                                message: 'Which employee would you like to delete?',
                                choices: employeeChoice,
                            }
                        ])
                            .then((answers) => {
                                const queryText = 'DELETE FROM employee WHERE id = $1';
                                pool.query(queryText, [answers.employee], (err) => {
                                    if (err) {
                                        console.log('Error deleting employee:', err);
                                    } else {
                                        console.log(`Deleted employee from the database`);
                                    }
                                    questions();
                                })
                            })
                    })
                    .catch((error) => {
                        console.error('Error deleting employee:', error);
                    });
            } else if (answers.start === 'View Total Utilized Budget of Department') {
                getDepartmentNames()
                    .then((data) => {
                        const departments = data.map(department => ({ name: department.name, value: department.id }));
                        inquirer.prompt([
                            {
                                type: 'list',
                                name: 'department',
                                message: `Which department's budget would you like to view?`,
                                choices: departments,
                            },
                        ])
                            .then((answers) => {
                                const queryText = 'SELECT department.id, department.name AS department, SUM(role.salary) AS totalUtilizedBudget FROM department JOIN role ON department.id = role.department_id WHERE department.id = $1 GROUP BY department.id';
                                pool.query(queryText, [answers.department], (err, { rows }) => {
                                    if (err) {
                                        console.log('Error viewing budget:', err);
                                    } else {
                                        consoleTable(rows);
                                        questions();
                                    }

                                });
                            })
                    })
                    .catch((error) => {
                        console.error('Error viewing budget:', error);
                    });


            };

        })

};


module.exports = { questions };