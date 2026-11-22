> **Historical document.** These diagrams describe the app before the
> Night Market redesign (group-first canvas, ledger, timeline and settle
> board). Kept for context only — the current UI is documented in README.md.

# SplitMate — Complete Application Flow

## 1. Top-Level Navigation & Shell

```mermaid
flowchart TB
    subgraph Shell["App Shell (ThemeProvider → ToastProvider → AuthProvider)"]
        direction TB
        
        subgraph Unauthenticated["Unauthenticated Routes"]
            LOGIN["/login"]
            REGISTER["/register"]
            FORGOT["/forgot-password (static)"]
            TERMS["/terms (static)"]
            PRIVACY["/privacy (static)"]
        end
        
        subgraph Authenticated["Authenticated Shell (Layout)"]
            direction TB
            SIDEBAR["Sidebar<br/>5 nav: Dashboard, Groups, Friends, Activity, Settlements<br/>+ Logout button"]
            TOPBAR["TopBar<br/>Search icon, Theme toggle,<br/>Notifications bell + badge,<br/>Add Expense pill, Profile avatar"]
            CONTENT["Main Content (Outlet)"]
        end
        
        LOGIN -->|"Success"| AUTH_GUARD["RouteGuard<br/>(checks auth context)"]
        REGISTER -->|"Success"| AUTH_GUARD
        AUTH_GUARD --> Authenticated
        Authenticated -->|"Logout"| LOGIN
    end
```

## 2. Login Page

```mermaid
flowchart TD
    subgraph LOGIN_PAGE["/login — Login Page"]
        direction TB
        
        subgraph LeftPanel["Left Panel (clay gradient)"]
            ICON["donut_small icon"]
            HEADING["Fraunces: 'Expense Tracking, Elevated.'"]
        end
        
        subgraph RightPanel["Right Panel (form)"]
            LOGO["donut_small + SplitMate heading"]
            SUBTITLE["Welcome back. Please enter your details."]
            
            subgraph LoginForm["Form Card (paper surface)"]
                ERROR["Error banner (if any)"]
                EMAIL_INPUT["Email input (email, required)"]
                PASSWORD_INPUT["PasswordInput component<br/>• show/hide toggle<br/>• lock icon"]
                REMEMBER["Remember me checkbox"]
                FORGOT_LINK["Forgot password? → /forgot-password"]
                SUBMIT["Sign In button (clay bg)"]
            end
            
            DIVIDER["AuthDivider: 'Or continue with'"]
            GOOGLE["Google Login button (disabled, 'Coming soon')"]
            
            FOOTER["Don't have an account? Create Account → /register"]
            TERMS_FOOTER["Terms of Service · Privacy Policy"]
        end
    end
    
    EMAIL_INPUT -->|"POST /api/auth/login"| API_LOGIN["Backend: auth.ts<br/>loginSchema: email + password<br/>→ verify password<br/>→ sign JWT<br/>→ set session cookie<br/>→ return {token, user}"]
    API_LOGIN -->|"200 + cookie"| REDIRECT["Navigate to /dashboard"]
    API_LOGIN -->|"401/500"| ERROR
    SUBMIT --> EMAIL_INPUT
    SUBMIT --> PASSWORD_INPUT
    
    GOOGLE -.->|"Coming soon"| DO_NOTHING
```

## 3. Register Page

```mermaid
flowchart TD
    subgraph REGISTER_PAGE["/register — Register Page"]
        direction TB
        
        subgraph LeftPanel["Left Panel (clay gradient)"]
            ICON["donut_small icon"]
            HEADING["SplitMate branding"]
        end
        
        subgraph RightPanel["Right Panel (form)"]
            LOGO["donut_small + SplitMate heading"]
            SUBTITLE["Create your account"]
            
            subgraph RegisterForm["Form Card (paper surface)"]
                ERROR["Error banner (if any)"]
                NAME_INPUT["Name input (text, required)"]
                EMAIL_INPUT["Email input (email, required)"]
                PASSWORD_INPUT["PasswordInput<br/>• show/hide toggle<br/>• strength indicator (bar)"]
                CONFIRM_INPUT["Confirm Password input"]
                TERMS_CHECK["I agree to Terms checkbox"]
                SUBMIT["Create Account button (clay bg)"]
            end
            
            DIVIDER["AuthDivider: 'Or continue with'"]
            GOOGLE["Google Sign Up button (disabled)"]
            
            FOOTER["Already have an account? Sign In → /login"]
        end
    end
    
    EMAIL_INPUT -->|"POST /api/auth/register"| API_REGISTER["Backend: auth.ts<br/>registerSchema: email + password + name + avatar_bg<br/>→ check duplicate<br/>→ hash password<br/>→ INSERT user<br/>→ sign JWT<br/>→ set cookie<br/>→ return {token, user}"]
    API_REGISTER -->|"201 + cookie"| REDIRECT["Navigate to /dashboard"]
    API_REGISTER -->|"409 Conflict"| ERROR["'Email already registered'"]
    SUBMIT --> EMAIL_INPUT
```

## 4. Dashboard Page

```mermaid
flowchart TD
    subgraph DASHBOARD["/dashboard — Dashboard"]
        direction TB
        
        HEADER["'Dashboard' headline + 'Here's your financial overview.'"]
        
        subgraph HeroBalance["Hero Balance Card (full width, clay border)"]
            BALANCE_ICON["clay bg icon"]
            BALANCE_LABEL["'Total Balance'"]
            BALANCE_AMOUNT["₹659.60 (Fraunces, large)"]
            BALANCE_SUB["'Across all your groups'"]
        end
        
        subgraph SupportingCards["Supporting Cards (2-col grid)"]
            OWED_CARD["You're Owed (teal border)<br/>₹659.60"]
            OWE_CARD["You Owe (red border)<br/>₹0.00"]
        end
        
        subgraph ContentGrid["2-column Content Grid"]
            subgraph ActivityPanel["Recent Activity (left)"]
                ACTIVITY_HEADER["'Recent Activity' + 'View all →'"]
                ACTIVITY_ITEM1["BlobAvatar + Demo User 1<br/>added an expense<br/>+₹450.00 · 2h ago"]
                ACTIVITY_ITEM2["BlobAvatar + Demo User 2<br/>joined a group<br/>1d ago"]
                ACTIVITY_EMPTY["EmptyState (if no activity)"]
                VIEW_ALL["'View all →' → /activity"]
            end
            
            subgraph GroupsPanel["My Groups (right)"]
                GROUPS_HEADER["'My Groups' + 'Create New Group'"]
                GROUP_ITEM1["CategoryIcon + Weekend Gang<br/>+₹120.00"]
                GROUP_ITEM2["CategoryIcon + Apartment 4B<br/>-₹50.00"]
                GROUP_EMPTY["EmptyState: 'No groups yet'<br/>Create Group button → /groups?new=1"]
                CREATE_GROUP["'Create New Group →' → /groups?new=1"]
            end
        end
    end
    
    VIEW_ALL --> NAV_ACTIVITY["Navigate to /activity"]
    CREATE_GROUP --> NAV_GROUPS["Navigate to /groups?new=1"]
    
    subgraph API["API Calls"]
        BALANCES_API["GET /api/balances → {groups, friends, total}"]
        ACTIVITY_API["GET /api/activity?limit=5 → {events}"]
    end
```

## 5. Groups Page

```mermaid
flowchart TD
    subgraph GROUPS["/groups — My Groups"]
        direction TB
        
        HEADER["'My Groups' headline"]
        
        subgraph Toolbar["Toolbar"]
            SEARCH["Search input (filters by name)"]
            FILTER_BTN["Filter icon button"]
            DROPDOWN["'All Groups' dropdown"]
            NEW_GROUP_BTN["New Group button (clay) → opens modal"]
        end
        
        subgraph GroupCards["Group Cards (list layout)"]
            CARD1["CategoryIcon (star) + Weekend Gang<br/>social · 8 members<br/>Avatar stack (DL +2)<br/>YOUR BALANCE: +₹120.00"]
            CARD2["CategoryIcon (briefcase) + Office Lunch<br/>office · 5 members<br/>Avatar stack (AB +3)<br/>YOUR BALANCE: +₹45.00"]
            CARD3["CategoryIcon (house) + Apartment 4B<br/>home · 4 members<br/>Avatar stack (MK +2)<br/>YOUR BALANCE: -₹50.00"]
            CARD4["CategoryIcon (star) + Goa Trip 2026<br/>trip · 8 members<br/>Avatar stack (RS +5)<br/>YOUR BALANCE: +₹250.00"]
            EMPTY_STATE["EmptyState: 'No groups yet'"]
        end
        
        subgraph CreateModal["Create Group Modal"]
            MODAL_INPUT["Group Name input"]
            MODAL_CANCEL["Cancel button"]
            MODAL_CREATE["Create Group button"]
        end
    end
    
    CARD1 -->|"Click"| GROUP_DETAIL["Navigate to /groups/:id"]
    CARD2 --> GROUP_DETAIL
    CARD3 --> GROUP_DETAIL
    CARD4 --> GROUP_DETAIL
    
    NEW_GROUP_BTN --> MODAL_INPUT
    MODAL_CREATE -->|"POST /api/groups"| SUCCESS["Toast: 'Group created'"]
    SUCCESS --> REFETCH["Refetch groups list"]
    
    URL_PARAM{"?new=1 in URL?"}
    URL_PARAM -->|Yes| MODAL_INPUT
    
    subgraph API["API Call"]
        GROUPS_API["GET /api/groups → {groups: [...]}"]
    end
```

## 6. Group Detail Page

```mermaid
flowchart TD
    subgraph GROUP_DETAIL["/groups/:id — Group Detail"]
        direction TB
        
        subgraph GroupHeader["Header"]
            CAT_ICON["CategoryIcon (large, 64px)"]
            GROUP_NAME["Group name (Fraunces)"]
            GROUP_META["type · N members"]
            INVITE_BTN["Invite button → invite modal"]
            ADD_EXPENSE_BTN["Add Expense → /expenses/add?group=:id"]
            SETTLE_BTN["Settle Up → settle modal"]
        end
        
        subgraph StatsRow["Stats Row (3 cards)"]
            GROUP_NET["Group Net"]
            MY_SHARE["My Share"]
            SETTLED["Settled"]
            PENDING["Pending"]
        end
        
        subgraph MembersSection["Members"]
            MEMBER1["BlobAvatar + User A<br/>You paid ₹450.00<br/>+₹120.00"]
            MEMBER2["BlobAvatar + User B<br/>They paid ₹200.00<br/>-₹50.00"]
        end
        
        subgraph ExpensesSection["Expenses"]
            EXP_HEADER["'Expenses' + 'Add' link"]
            EXP1["restaurant icon + Dinner<br/>₹800.00 · Aug 5<br/>Paid by User A"]
            EXP2["directions_car icon + Cab fare<br/>₹350.00 · Aug 4<br/>Paid by User B"]
            EXP_EMPTY["EmptyState: 'No expenses yet'<br/>Add Expense button"]
        end
        
        subgraph SettlementsSection["Settlements"]
            SETT_HEADER["'Settlements'"]
            SETT1["User A → User B<br/>₹200.00 · pending<br/>Confirm button · Remove button"]
            SETT_EMPTY["EmptyState: 'No settlements yet'"]
        end
        
        subgraph Modals["Modals"]
            subgraph InviteModal["Invite Member Modal"]
                INVITE_EMAIL["Email input"]
                INVITE_CANCEL["Cancel"]
                INVITE_SEND["Send Invite"]
            end
            
            subgraph SettleModal["Settle Up Modal"]
                SETTLE_PAYTO["Pay to: select member"]
                SETTLE_AMOUNT["Amount (₹) input"]
                SETTLE_NOTE["Note (optional)"]
                SETTLE_CANCEL["Cancel"]
                SETTLE_RECORD["Record button"]
            end
        end
    end
    
    EXP1 -->|"Click"| EXPENSE_DETAIL["Navigate to /expenses/:id"]
    SETTLE_RECORD -->|"POST /api/groups/:id/settlements"| SETTLE_SUCCESS["Toast: 'Settlement recorded'"]
    INVITE_SEND -->|"POST /api/groups/:id/invite"| INVITE_SUCCESS["Toast: 'Invite sent'"]
    
    subgraph API["API Calls"]
        GROUP_API["GET /api/groups/:id → {group, expenses, settlements}"]
        BALANCES_GROUP["GET /api/groups/:id/simplify → {transactions}"]
    end
```

## 7. Friends Page

```mermaid
flowchart TD
    subgraph FRIENDS["/friends — Friends"]
        direction TB
        
        HEADER["'Friends' headline + subtitle"]
        ADD_FRIEND_BTN["Add Friend button (clay) → opens modal"]
        
        subgraph Tabs["Tabs"]
            FRIENDS_TAB["Friends (11)"]
            REQUESTS_TAB["Requests (2) <Badge>"]
        end
        
        subgraph FriendsList["Friends Tab — 3-col grid"]
            FRIEND_CARD1["BlobAvatar (green) + Demo User 1<br/>demo001@splitmate.app<br/>₹37.50 (positive, clay)<br/>Settle Up button"]
            FRIEND_CARD2["BlobAvatar (pink) + Demo User 2<br/>demo002@splitmate.app<br/>₹0.00<br/>Settle Up button"]
            FRIEND_EMPTY["EmptyState: 'No friends yet'"]
        end
        
        subgraph RequestsList["Requests Tab"]
            INCOMING_ROW["Demo User 3<br/>incoming badge<br/>Accept · Decline buttons"]
            OUTGOING_ROW["Demo User 4<br/>outgoing badge"]
            REQUESTS_EMPTY["'No requests'"]
        end
        
        subgraph AddFriendModal["Add Friend Modal"]
            FRIEND_EMAIL["Friend's email input"]
            FRIEND_CANCEL["Cancel"]
            FRIEND_SEND["Send Request"]
        end
    end
    
    FRIEND_CARD1 -->|"Click 'Settle Up'"| SETTLEMENTS["Navigate to /settlements"]
    ACCEPT_BTN["Accept"] -->|"PATCH /api/friends/requests/:id/accept"| ACCEPT_SUCCESS["Toast: 'Friend added'"]
    DECLINE_BTN["Decline"] -->|"PATCH /api/friends/requests/:id/decline"| DECLINE_SUCCESS["Toast: 'Request declined'"]
    FRIEND_SEND -->|"POST /api/friends/requests"| SEND_SUCCESS["Toast: 'Request sent'"]
    
    subgraph API["API Calls"]
        FRIENDS_API["GET /api/friends → {friends: [...]}"]
        REQUESTS_API["GET /api/friends/requests → {incoming, outgoing}"]
    end
```

## 8. Activity Page

```mermaid
flowchart TD
    subgraph ACTIVITY["/activity — Activity History"]
        direction TB
        
        HEADER["'Activity History' headline + subtitle"]
        
        subgraph Toolbar["Toolbar"]
            SEARCH["Search input (filters by description)"]
            FILTER_BTN["Filter button (tune icon)"]
            FILTER_DROPDOWN["Filter dropdown:<br/>• All Activity<br/>• Expenses<br/>• Settlements<br/>• Groups<br/>• Friends"]
        end
        
        subgraph TodaySection["TODAY"]
            ACT1["BlobAvatar + Demo User 1<br/>added an expense<br/>₹450.00 · 2h ago"]
            ACT2["BlobAvatar + Demo User 2<br/>joined a group · 5h ago"]
        end
        
        subgraph YesterdaySection["YESTERDAY"]
            ACT3["BlobAvatar + Demo User 3<br/>sent a friend request<br/>1d ago"]
            ACT4["BlobAvatar + Demo User 4<br/>created a group<br/>2d ago"]
        end
        
        LOAD_MORE["Load More button"]
        EMPTY_STATE["EmptyState: 'No activity yet'"]
    end
    
    ACT1 -->|"Click expense"| EXPENSE_DETAIL["Navigate to /expenses/:id"]
    
    subgraph API["API Call"]
        ACTIVITY_API["GET /api/activity?type=&page=&limit=30<br/>→ {events, page, hasMore}"]
    end
    
    subgraph EventTypes["Activity Event Types"]
        T1["expense_added"]
        T2["expense_edited"]
        T3["settlement_made"]
        T4["settlement_received"]
        T5["group_created"]
        T6["group_joined"]
        T7["friend_added"]
        T8["friend_request"]
    end
```

## 9. Settlements Page

```mermaid
flowchart TD
    subgraph SETTLEMENTS["/settlements — Settlements"]
        direction TB
        
        HEADER["'Settlements' headline + subtitle"]
        
        subgraph Toolbar["Toolbar"]
            GROUP_SELECT["Group select dropdown"]
            NEW_SETTLE_BTN["New Settlement button (clay) → opens modal"]
        end
        
        subgraph SettlementList["Settlement List"]
            SETT_ROW1["Demo User A → Demo User B<br/>₹200.00 · pending<br/>[Confirm] [Remove]<br/>(Confirm shown only if you're payee)"]
            SETT_ROW2["Demo User C → You<br/>₹150.00 · confirmed<br/>badge green"]
            SETT_EMPTY["EmptyState: 'No settlements yet'"]
        end
        
        subgraph NewSettleModal["New Settlement Modal"]
            SETTLE_PAYTO["Pay to: select member"]
            SETTLE_AMOUNT["Amount (₹) input"]
            SETTLE_CANCEL["Cancel"]
            SETTLE_RECORD["Record button"]
        end
    end
    
    SETT_ROW1 -->|"Click Confirm"| CONFIRM_ACTION["PATCH /api/settlements/:id/confirm"]
    SETT_ROW1 -->|"Click Remove"| REMOVE_ACTION["DELETE /api/settlements/:id"]
    SETTLE_RECORD -->|"POST /api/groups/:id/settlements"| SETTLE_SUCCESS["Toast: 'Settlement recorded'"]
    
    subgraph API["API Calls"]
        SETTLEMENTS_API["GET /api/groups/:id/settlements?status= → {settlements}"]
    end
```

## 10. Add Expense Page

```mermaid
flowchart TD
    subgraph ADD_EXPENSE["/expenses/add — Add Expense"]
        direction TB
        
        HEADER["'Add Expense' headline + subtitle"]
        
        subgraph ExpenseForm["Form Card"]
            GROUP_SELECT["Group select<br/>(auto-selected if ?group= param)"]
            DESCRIPTION["Description input"]
            AMOUNT["Amount (₹) input"]
            PAID_BY["Paid by: select member"]
            CATEGORY["Category select<br/>Food, Transport, Shopping,<br/>Bills, Entertainment, Other"]
            SPLIT_MODE["Split mode: Equal"]
            EXPENSE_DATE["Expense date"]
            
            subgraph Participants["Participants (checkboxes)"]
                P1["☑ User A"]
                P2["☑ User B"]
                P3["☑ User C"]
                P4["☐ User D"]
            end
            
            CANCEL["Cancel → navigate(-1)"]
            SUBMIT["Add Expense button"]
        end
    end
    
    SUBMIT -->|"POST /api/groups/:id/expenses"| EXPENSE_SUCCESS["Toast: 'Expense added'"]
    EXPENSE_SUCCESS --> NAV_BACK["Navigate back"]
    
    subgraph API["API Call"]
        GROUP_EXPENSES["POST /api/groups/:id/expenses<br/>{paidBy, amountPaise, description,<br/>category, splitMode, participants, expenseDate}"]
    end
    
    subgraph BackendProcessing["Backend Processing"]
        COMPUTE["computeSplits() — equal split"]
        INSERT_EXPENSE["INSERT expenses table"]
        INSERT_SPLITS["INSERT expense_splits table"]
        UPDATE_BALANCES["UPDATE balances table (UPSERT)"]
        UPDATE_SPENDING["UPDATE spending_summary_monthly"]
        LOG_ACTIVITY["INSERT activity_events"]
    end
```

## 11. Expense Details Page

```mermaid
flowchart TD
    subgraph EXPENSE_DETAIL["/expenses/:id — Expense Details"]
        direction TB
        
        subgraph ExpenseInfo["Expense Info Card"]
            CATEGORY_ICON["Category icon (per category)"]
            DESCRIPTION["Description (Fraunces)"]
            AMOUNT["Amount (₹)"]
            PAID_BY["Paid by: User A"]
            CATEGORY["Category: Food"]
            DATE["Date: Aug 5, 2026"]
            SPLIT_MODE["Split mode: Equal"]
        end
        
        subgraph SplitsSection["Splits"]
            SPLIT1["User A — ₹400.00"]
            SPLIT2["User B — ₹200.00"]
            SPLIT3["User C — ₹200.00"]
        end
        
        DELETE_BTN["Delete button"]
        BACK_BTN["← Back"]
    end
    
    DELETE_BTN -->|"Confirm dialog"| DELETE_EXPENSE["DELETE /api/expenses/:id"]
    DELETE_EXPENSE --> SUCCESS["Toast: 'Expense deleted'"]
    SUCCESS --> NAV_BACK["Navigate back"]
```

## 12. Analytics Page

```mermaid
flowchart TD
    subgraph ANALYTICS["/analytics — Analytics"]
        direction TB
        
        HEADER["'Analytics' headline"]
        
        subgraph MonthlySpend["Monthly Spending"]
            MONTH_SELECTOR["Month selector"]
            TOTAL_SPEND["Total Spent (₹)"]
            SETTLED["Settled (₹)"]
            REMAINING["Remaining (₹)"]
        end
        
        subgraph ByGroup["Spending by Group"]
            GROUP_BAR1["Goa Trip 2026 — ₹2,400"]
            GROUP_BAR2["Apartment 4B — ₹1,200"]
            GROUP_BAR3["Office Lunch — ₹800"]
        end
        
        subgraph ByCategory["Spending by Category"]
            CAT_BAR1["Food — ₹1,800"]
            CAT_BAR2["Transport — ₹1,200"]
            CAT_BAR3["Shopping — ₹600"]
        end
        
        subgraph LargestExpenses["Largest Expenses (Top 5)"]
            LARGE1["1. Flight tickets — ₹5,000 (User A)"]
            LARGE2["2. Hotel booking — ₹3,200 (User B)"]
        end
    end
    
    subgraph API["API Calls"]
        MONTHLY_API["GET /api/analytics/monthly?month=YYYY-MM"]
        BREAKDOWN_API["GET /api/analytics/breakdown"]
    end
```

## 13. Profile & Settings Page

```mermaid
flowchart TD
    subgraph PROFILE["/profile — Profile & Settings"]
        direction TB
        
        subgraph ProfileHeader["Profile Header"]
            BLOB_AVATAR["BlobAvatar (size 80)"]
            USER_NAME["Name (Fraunces)"]
            USER_EMAIL["Email"]
            STATS["Groups: 4 · Friends: 11"]
        end
        
        subgraph EditProfile["Edit Profile Card"]
            NAME_INPUT["Name input"]
            EMAIL_INPUT["Email input"]
            
            subgraph AvatarColorPicker["Avatar Color Picker"]
                COLOR1["bg-primary-container"]
                COLOR2["bg-secondary-container"]
                COLOR3["bg-tertiary-container"]
                COLOR4["bg-error-container"]
            end
            
            SAVE_PROFILE["Save button"]
            
            subgraph EmailConfirm["Email Change Confirmation (conditional)"]
                EMAIL_PASSWORD["Current Password (required)"]
                SAVE_EMAIL["Save Email button"]
            end
        end
        
        subgraph ChangePassword["Change Password Card"]
            CURRENT_PW["Current Password input"]
            NEW_PW["New Password input (with strength indicator)"]
            UPDATE_PW["Update Password button"]
        end
        
        subgraph Preferences["Preferences (read-only)"]
            CURRENCY["Currency: INR ₹"]
            THEME_PREF["Theme: System"]
        end
        
        LOGOUT["Log Out button (danger)"]
    end
    
    SAVE_PROFILE -->|"PATCH /api/users/me<br/>{name, avatar_bg}"| SAVE_SUCCESS["Toast: 'Profile updated'"]
    SAVE_SUCCESS --> UPDATE_CONTEXT["setSession({...user, ...res})"]
    
    SAVE_EMAIL -->|"POST /api/users/me/email<br/>{email, password}"| EMAIL_SUCCESS["Toast: 'Email updated'"]
    
    UPDATE_PW -->|"POST /api/users/me/password<br/>{currentPassword, newPassword}"| PW_SUCCESS["Toast: 'Password updated'"]
    
    LOGOUT -->|"POST /api/auth/logout"| LOGOUT_ACTION["Clear cookie → /login"]
    
    subgraph EmailFlow["Email Change Flow"]
        EDIT_EMAIL["User edits email field"] --> EMAIL_CHANGED{"emailChanged?"}
        EMAIL_CHANGED -->|Yes| SHOW_PASSWORD["Show password field"]
        EMAIL_CHANGED -->|No| HIDE_PASSWORD["Hide password field"]
        SHOW_PASSWORD --> USER_ENTERS_PW["User enters current password"]
        USER_ENTERS_PW --> SAVE_EMAIL
    end
```

## 14. Notifications Page

```mermaid
flowchart TD
    subgraph NOTIFICATIONS["/notifications — Notifications"]
        direction TB
        
        HEADER["'Notifications' headline"]
        MARK_ALL["Mark all as read button"]
        
        subgraph NotificationList["Notification List"]
            NOTIF1["🔔 Settlement awaiting confirmation<br/>Confirm the settlement from Demo User A<br/>2h ago · unread"]
            NOTIF2["🔔 Friend request from Demo User C<br/>Accept or decline the request<br/>1d ago · unread"]
            NOTIF3["✅ Expense added to Weekend Gang<br/>Demo User 1 added 'Dinner' ₹800<br/>2d ago · read"]
            NOTIF_EMPTY["EmptyState: 'No notifications'"]
        end
    end
    
    NOTIF1 -->|"Click"| SETTLEMENTS["Navigate to /settlements"]
    NOTIF2 -->|"Click"| FRIENDS["Navigate to /friends"]
    MARK_ALL -->|"POST /api/notifications/read-all"| MARK_SUCCESS["All marked read"]
    
    subgraph API["API Calls"]
        NOTIFICATIONS_API["GET /api/notifications → {notifications}"]
        READ_ALL_API["POST /api/notifications/read-all"]
    end
```

## 15. Theme Toggle (Global)

```mermaid
flowchart TD
    subgraph THEME["Theme System"]
        TOGGLE["TopBar: sun/moon icon button"]
        
        LIGHT["Light Mode<br/>Oat bg #F1EAE0, Paper #FBF7F1<br/>Clay #A64B2A, Olive #6B7A4F"]
        DARK["Dark Mode<br/>Warm dark bg #1A1612<br/>Surface #242019<br/>Clay #C4603A"]
        
        TOGGLE -->|"click"| SWITCH["toggleTheme()"]
        SWITCH --> ADD_CLASS["document.documentElement.classList.toggle('dark')"]
        SWITCH --> SAVE["localStorage.setItem('splitmate-theme', theme)"]
        ADD_CLASS --> CSS_OVERRIDE["CSS .dark selector overrides all --color-* tokens"]
    end
    
    subgraph FlashPrevention["Flash Prevention"]
        INDEX_SCRIPT["index.html inline script<br/>reads localStorage BEFORE React<br/>sets .dark class immediately"]
    end
```

## 16. Complete Backend API Map

```mermaid
flowchart LR
    subgraph Auth["Auth Routes"]
        REG["POST /api/auth/register<br/>→ {email, password, name, avatar_bg}"]
        LOGIN["POST /api/auth/login<br/>→ {email, password, remember}"]
        LOGOUT["POST /api/auth/logout"]
    end
    
    subgraph Users["User Routes"]
        GET_ME["GET /api/users/me"]
        PATCH_ME["PATCH /api/users/me<br/>→ {name?, avatar_bg?}"]
        CHG_EMAIL["POST /api/users/me/email<br/>→ {email, password}"]
        CHG_PW["POST /api/users/me/password<br/>→ {currentPassword, newPassword}"]
    end
    
    subgraph Groups["Group Routes"]
        LIST_GROUPS["GET /api/groups"]
        CREATE_GROUP["POST /api/groups<br/>→ {name, type?, description?}"]
        GET_GROUP["GET /api/groups/:id"]
        PATCH_GROUP["PATCH /api/groups/:id"]
        DEL_GROUP["DELETE /api/groups/:id"]
        INVITE["POST /api/groups/:id/invite<br/>→ {email}"]
    end
    
    subgraph Expenses["Expense Routes"]
        LIST_EXP["GET /api/groups/:id/expenses"]
        CREATE_EXP["POST /api/groups/:id/expenses<br/>→ {paidBy, amountPaise, description,<br/>category, splitMode, participants,<br/>expenseDate}"]
        GET_EXP["GET /api/expenses/:id"]
        PATCH_EXP["PATCH /api/expenses/:id"]
        DEL_EXP["DELETE /api/expenses/:id"]
    end
    
    subgraph Settlements["Settlement Routes"]
        LIST_SETT["GET /api/groups/:id/settlements?status="]
        CREATE_SETT["POST /api/groups/:id/settlements<br/>→ {payerId, payeeId, amountPaise,<br/>method?, note?}"]
        CONFIRM_SETT["PATCH /api/settlements/:id/confirm"]
        DEL_SETT["DELETE /api/settlements/:id"]
    end
    
    subgraph Friends["Friend Routes"]
        LIST_FRIENDS["GET /api/friends"]
        LIST_REQUESTS["GET /api/friends/requests"]
        SEND_REQUEST["POST /api/friends/requests<br/>→ {email}"]
        ACCEPT["PATCH /api/friends/requests/:id/accept"]
        DECLINE["PATCH /api/friends/requests/:id/decline"]
        REMOVE_FRIEND["DELETE /api/friends/:id"]
    end
    
    subgraph Balances["Balance Routes"]
        ALL_BALANCES["GET /api/balances<br/>→ {groups, friends, total}"]
        SIMPLIFY["GET /api/groups/:id/simplify<br/>→ {transactions}"]
    end
    
    subgraph Other["Other Routes"]
        ACTIVITY["GET /api/activity?type=&page=&limit="]
        NOTIFICATIONS["GET /api/notifications"]
        READ_ALL_NOTIF["POST /api/notifications/read-all"]
        MONTHLY["GET /api/analytics/monthly?month="]
        BREAKDOWN["GET /api/analytics/breakdown"]
    end
```

## 17. Data Flow Summary

```mermaid
flowchart TD
    subgraph UserActions["User Actions"]
        A1["Login / Register"]
        A2["View Dashboard"]
        A3["Create Group"]
        A4["Invite Member"]
        A5["Add Expense"]
        A6["Record Settlement"]
        A7["Confirm Settlement"]
        A8["Send Friend Request"]
        A9["Accept Friend Request"]
        A10["Update Profile"]
        A11["Change Password"]
        A12["Toggle Theme"]
    end
    
    subgraph SideEffects["Side Effects"]
        SE1["JWT cookie set"]
        SE2["Balance recalculation"]
        SE3["Monthly spending updated"]
        SE4["Activity event logged"]
        SE5["Notification created"]
        SE6["Auth context updated"]
        SE7["CSS class toggled"]
        SE8["localStorage updated"]
    end
    
    A1 --> SE1
    A5 --> SE2
    A5 --> SE3
    A5 --> SE4
    A6 --> SE5
    A8 --> SE5
    A9 --> SE6
    A10 --> SE6
    A12 --> SE7
    A12 --> SE8
```
