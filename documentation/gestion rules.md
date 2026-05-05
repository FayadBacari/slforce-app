
# 📜 Business Rules for the Messaging Application

## 📌 Visiting the Application

- 🌍 A visitor can access the homepage of the application.
- 👀 A visitor can view the services offered by the application.
- 📝 Registration


## 📝 Registration

- 🆕 A visitor can register and become a user.
- 🔄 The visitor must choose to register as a Coach or Athlete.
- 🖊️ The visitor must fill out a form with personal information.
- 🔑 Login


## 🔑 Login

- 🔓 A user can log in via a login form.
- 📧 The user must provide their email and password to authenticate.
- 🆘 If the user forgets their password, they can request a reset link via email.
- 🚫 A user is allowed 8 failed login attempts before temporary access restriction.
- 🛠️ User Profile Management


## 🛠️ User Profile Management

- ✉️ A user can update their email.
- 🔒 A user can update their password.
- 🏷️ A user can update their first name.
- 🏷️ A user can update their last name.
- 🗑️ A user can request account deletion.
- ⏸️ A user can deactivate their account.
- 🔄 A user can reactivate their account within 30 days.
- 🏋️ Athlete-Specific Rules


## 🏋️ Athlete-Specific Rules

- ⚖️ An athlete must provide their weight category.
- 📅 An athlete must provide the date of their next competition.
- 🔄 An athlete can update their weight category.
- 🔄 An athlete can update their competition date.
- 💳 An athlete must have an active PayPal subscription to access premium features.
- 🏆 Coach-Specific Rules


## 🏆 Coach-Specific Rules

- 💰 A coach must define a monthly subscription price.
- 💳 A coach must have an active Stripe subscription to provide services.
- 👨‍💻 Admin Privileges


## 👨🏽‍💻 Admin Privileges

- ❌ The admin can delete an account.
- 🚷 The admin can ban an account.
- 💰 Subscription and Payments


## 💰 Subscription and Payments

- 🏋️‍♂️ An athlete can subscribe to a coach.
- 💵 Subscription payments for athletes are managed via PayPal.
- 💲 Subscription payments for coaches are managed via Stripe.
- ❌ An athlete can cancel their subscription at any time.
- ⚠️ An athlete loses access to premium features if the subscription is not renewed.
- 🔄 A coach must maintain an active Stripe subscription to keep their coaching status.
- 💬 Messaging System


## 💬 Messaging System

- 🗨️ A coach and an athlete can chat with each other.
- 🔄 Messages are handled via Stream Chat.
- ✉️ A user can send text messages.
- 🗑️ A user can delete their messages.
- 🚩 A user can report inappropriate messages.
- ✅ Messages must have a status (e.g., sent, delivered, read).


