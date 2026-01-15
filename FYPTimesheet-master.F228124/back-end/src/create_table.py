import sqlite3


db_path = "db.sqlite3"  
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

create_table_sql = """
CREATE TABLE IF NOT EXISTS timesheet_app_leaverequest (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    leave_type TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending',
    manager_comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES auth_user (id) ON DELETE CASCADE
);
"""


cursor.execute(create_table_sql)
conn.commit()
conn.close()


