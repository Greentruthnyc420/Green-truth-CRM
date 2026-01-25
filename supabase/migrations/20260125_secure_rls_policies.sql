-- =====================================================
-- SECURITY FIX: Complete RLS Policy Overhaul
-- Removes ALL public/anonymous access
-- Implements role-based access control
-- Applied: 2026-01-25
-- =====================================================

-- ============== USERS TABLE ==============
-- Remove dangerous anonymous access policies
DROP POLICY IF EXISTS "enable_anon_read_users" ON public.users;
DROP POLICY IF EXISTS "enable_anon_update_users" ON public.users;
DROP POLICY IF EXISTS "enable_anon_delete_users" ON public.users;

-- Admins can read/update/delete all users
CREATE POLICY "admins_read_all_users" ON public.users
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()::text AND u.role = 'admin'));

CREATE POLICY "admins_update_all_users" ON public.users
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()::text AND u.role = 'admin'));

CREATE POLICY "admins_delete_users" ON public.users
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()::text AND u.role = 'admin'));

-- ============== ACTIVATIONS TABLE ==============
DROP POLICY IF EXISTS "activations_select_all" ON public.activations;
DROP POLICY IF EXISTS "activations_insert_all" ON public.activations;
DROP POLICY IF EXISTS "activations_update_all" ON public.activations;
DROP POLICY IF EXISTS "activations_delete_all" ON public.activations;

CREATE POLICY "activations_select_authenticated" ON public.activations FOR SELECT TO authenticated USING (true);
CREATE POLICY "activations_insert_authenticated" ON public.activations FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "activations_update_authenticated" ON public.activations FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "activations_delete_admins" ON public.activations FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()::text AND u.role = 'admin'));

-- ============== LEADS TABLE ==============
DROP POLICY IF EXISTS "leads_select_all" ON public.leads;
DROP POLICY IF EXISTS "leads_insert_all" ON public.leads;
DROP POLICY IF EXISTS "leads_update_all" ON public.leads;
DROP POLICY IF EXISTS "leads_delete_all" ON public.leads;

CREATE POLICY "leads_select_authenticated" ON public.leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "leads_insert_authenticated" ON public.leads FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "leads_update_own_or_admin" ON public.leads FOR UPDATE TO authenticated
  USING (assigned_ambassador_id = auth.uid()::text OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()::text AND u.role = 'admin'));
CREATE POLICY "leads_delete_admins" ON public.leads FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()::text AND u.role = 'admin'));

-- ============== SALES TABLE ==============
DROP POLICY IF EXISTS "sales_select_all" ON public.sales;
DROP POLICY IF EXISTS "sales_insert_all" ON public.sales;
DROP POLICY IF EXISTS "sales_update_all" ON public.sales;
DROP POLICY IF EXISTS "sales_delete_all" ON public.sales;

CREATE POLICY "sales_select_authenticated" ON public.sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "sales_insert_authenticated" ON public.sales FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "sales_update_own_or_admin" ON public.sales FOR UPDATE TO authenticated
  USING (rep_id = auth.uid()::text OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()::text AND u.role = 'admin'));
CREATE POLICY "sales_delete_admins" ON public.sales FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()::text AND u.role = 'admin'));

-- ============== ALL OTHER TABLES ==============
-- Pattern: Authenticated can read, admins can modify

-- AUDIT_LOGS (admin-only read, authenticated insert)
DROP POLICY IF EXISTS "Admins can read audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Anyone can insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_delete_all" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_all" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_select_all" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_update_all" ON public.audit_logs;

CREATE POLICY "audit_logs_select_admins" ON public.audit_logs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()::text AND u.role = 'admin'));
CREATE POLICY "audit_logs_insert_auth" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- BRANDS
DROP POLICY IF EXISTS "Allow all for brands" ON public.brands;
DROP POLICY IF EXISTS "brands_delete_all" ON public.brands;
DROP POLICY IF EXISTS "brands_insert_all" ON public.brands;
DROP POLICY IF EXISTS "brands_select_all" ON public.brands;
DROP POLICY IF EXISTS "brands_update_all" ON public.brands;

CREATE POLICY "brands_select_auth" ON public.brands FOR SELECT TO authenticated USING (true);
CREATE POLICY "brands_insert_admin" ON public.brands FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()::text AND u.role = 'admin'));
CREATE POLICY "brands_update_admin" ON public.brands FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()::text AND u.role = 'admin'));
CREATE POLICY "brands_delete_admin" ON public.brands FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()::text AND u.role = 'admin'));

-- PRODUCTS
DROP POLICY IF EXISTS "Public Access" ON public.products;
DROP POLICY IF EXISTS "products_delete_all" ON public.products;
DROP POLICY IF EXISTS "products_insert_all" ON public.products;
DROP POLICY IF EXISTS "products_select_all" ON public.products;
DROP POLICY IF EXISTS "products_update_all" ON public.products;

CREATE POLICY "products_select_auth" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "products_insert_admin" ON public.products FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()::text AND u.role = 'admin'));
CREATE POLICY "products_update_admin" ON public.products FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()::text AND u.role = 'admin'));
CREATE POLICY "products_delete_admin" ON public.products FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()::text AND u.role = 'admin'));

-- DEALS
DROP POLICY IF EXISTS "Anyone can view active deals" ON public.deals;
DROP POLICY IF EXISTS "Brands can manage their deals" ON public.deals;

CREATE POLICY "deals_select_auth" ON public.deals FOR SELECT TO authenticated USING (true);
CREATE POLICY "deals_insert_auth" ON public.deals FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "deals_update_admin" ON public.deals FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()::text AND u.role = 'admin'));
CREATE POLICY "deals_delete_admin" ON public.deals FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()::text AND u.role = 'admin'));

-- NOTIFICATIONS (users see own, admin sees all)
DROP POLICY IF EXISTS "Service can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;

CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()::text AND u.role = 'admin'));
CREATE POLICY "notifications_insert_auth" ON public.notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- NOTIFICATION_PREFERENCES (users manage own)
DROP POLICY IF EXISTS "Allow all notification prefs" ON public.notification_preferences;

CREATE POLICY "notification_preferences_select_own" ON public.notification_preferences FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()::text AND u.role = 'admin'));
CREATE POLICY "notification_preferences_insert_own" ON public.notification_preferences FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "notification_preferences_update_own" ON public.notification_preferences FOR UPDATE TO authenticated USING (user_id = auth.uid()::text);

-- POINTS_HISTORY
DROP POLICY IF EXISTS "Public Access" ON public.points_history;

CREATE POLICY "points_history_select_auth" ON public.points_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "points_history_insert_auth" ON public.points_history FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "points_history_modify_admin" ON public.points_history FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()::text AND u.role = 'admin'));

-- USER_ROLES
DROP POLICY IF EXISTS "user_roles_admin_policy" ON public.user_roles;

CREATE POLICY "user_roles_select_auth" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "user_roles_modify_admin" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()::text AND u.role = 'admin'));
CREATE POLICY "user_roles_update_admin" ON public.user_roles FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()::text AND u.role = 'admin'));
CREATE POLICY "user_roles_delete_admin" ON public.user_roles FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()::text AND u.role = 'admin'));

-- VEHICLES
DROP POLICY IF EXISTS "vehicles_authenticated_policy" ON public.vehicles;

CREATE POLICY "vehicles_select_auth" ON public.vehicles FOR SELECT TO authenticated USING (true);
CREATE POLICY "vehicles_insert_auth" ON public.vehicles FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "vehicles_update_admin" ON public.vehicles FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()::text AND u.role = 'admin'));
CREATE POLICY "vehicles_delete_admin" ON public.vehicles FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()::text AND u.role = 'admin'));

-- ============== DOCUMENTATION ==============
COMMENT ON TABLE public.users IS 'User profiles - Anonymous access removed 2026-01-25';
COMMENT ON TABLE public.leads IS 'Lead records - Public access removed 2026-01-25';
COMMENT ON TABLE public.sales IS 'Sales records - Public access removed 2026-01-25';
COMMENT ON TABLE public.activations IS 'Brand activations - Public access removed 2026-01-25';
