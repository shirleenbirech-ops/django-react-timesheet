

2. **Navigate to the project directory:**
   ```shell
    cd src

2. **Create and activate a virtual environment (optional but recommended)**
   ```shell
    python -m venv venv
    source venv/bin/activate  
    On Windows, use `venv\Scripts\activate`


2. **Install project Dependencies:** 
    ```shell
    pip install -r requirements.txt

3. **Install Channels:** 
    ```shell
    pip install channels

4. **Apply Database Migrations (Step1):** 
    ```shell
    python manage.py makemigrations


4. **Apply Database Migrations (Step2):** 
    ```shell
    python manage.py migrate

5. **Create Superuser:** 
    ```shell
    python manage.py createsuperuser
    username: admin
    password: admin   

5. **Run Development Server:** 
    ```shell
    python manage.py runserver    











