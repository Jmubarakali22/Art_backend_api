USE `ar_rahman_trust_db`;

-- Seed Admins (Default password: "password123", bcrypt hashed: $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi)
INSERT INTO `admins` (`id`, `username`, `email`, `password`, `name`, `role`) VALUES
(1, 'admin', 'admin@arrahmantrust.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Ar-Rahman Super Admin', 'superadmin'),
(2, 'trustee', 'trustee@arrahmantrust.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Managing Trustee', 'admin')
ON DUPLICATE KEY UPDATE `username`=`username`;

-- Seed Causes
INSERT INTO `causes` (`title`, `category`, `description`, `target_amount`, `raised_amount`, `image_url`, `status`, `featured`) VALUES
('Daily Food Distribution Drive', 'Food Relief', 'Providing hot nutritious meals and monthly dry food kits to needy families in Pernambut and surrounding rural villages.', 150000.00, 98500.00, 'https://ik.imagekit.io/baaidzoik/assets/gallery/AR_food_dist.png', 'active', 1),
('Free Tailoring Training Center for Women', 'Women Empowerment', 'Equipping underprivileged women and widows with certified tailoring, sewing machine mastery, and self-employment skills.', 100000.00, 75000.00, 'https://ik.imagekit.io/baaidzoik/assets/gallery/AR_tailoring_class.png', 'active', 1),
('Free Medicine & Regular Medical Camps', 'Healthcare', 'Conducting weekly health check-up camps, free diagnostic tests, and supplying essential medicines to elderly and sick villagers.', 200000.00, 142000.00, 'https://ik.imagekit.io/baaidzoik/assets/gallery/AR_medical_help.png', 'active', 1),
('Needy & Orphan Students Education Fund', 'Education', 'Sponsoring school fees, textbooks, uniforms, and stationery supplies for deserving students from low-income families.', 120000.00, 68000.00, 'https://ik.imagekit.io/baaidzoik/assets/gallery/AR_food_dist.png', 'active', 0),
('Ramadan Ration Kits & Eid Gift Distribution', 'Community Relief', 'Delivering grocery ration packages to 300+ destitute families during holy months to ensure no family stays hungry.', 250000.00, 250000.00, 'https://ik.imagekit.io/baaidzoik/assets/gallery/AR_food_dist.png', 'completed', 0);

-- Seed Gallery
INSERT INTO `gallery` (`title`, `caption`, `category`, `image_url`, `order_num`, `is_visible`) VALUES
('Ration Kit Distribution #1', 'Monthly essential food & grocery kit distribution to underprivileged families in Pernambut.', 'Food Distribution', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/ration-kit-food-dist/ration_kit_1.png', 1, 1),
('Ration Kit Distribution #2', 'Monthly essential food & grocery kit distribution to underprivileged families in Pernambut.', 'Food Distribution', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/ration-kit-food-dist/ration_kit_2.png', 2, 1),
('Ration Kit Distribution #3', 'Monthly essential food & grocery kit distribution to underprivileged families in Pernambut.', 'Food Distribution', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/ration-kit-food-dist/ration_kit_3.png', 3, 1),
('Ration Kit Distribution #4', 'Monthly essential food & grocery kit distribution to underprivileged families in Pernambut.', 'Food Distribution', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/ration-kit-food-dist/ration_kit_4.png', 4, 1),
('Ration Kit Distribution #5', 'Monthly essential food & grocery kit distribution to underprivileged families in Pernambut.', 'Food Distribution', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/ration-kit-food-dist/ration_kit_5.png', 5, 1),
('Food Distribution Drive #1', 'Direct hot meals & food packets serving needy village residents and elderly.', 'Food Distribution', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/ration-kit-food-dist/food_dist_1.png', 6, 1),
('Food Distribution Drive #2', 'Direct hot meals & food packets serving needy village residents and elderly.', 'Food Distribution', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/ration-kit-food-dist/food_dist_2.png', 7, 1),
('Food Distribution Drive #3', 'Direct hot meals & food packets serving needy village residents and elderly.', 'Food Distribution', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/ration-kit-food-dist/food_dist_3.png', 8, 1),
('Food Distribution Drive #4', 'Direct hot meals & food packets serving needy village residents and elderly.', 'Food Distribution', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/ration-kit-food-dist/food_dist_4.png', 9, 1),
('Food Distribution Drive #5', 'Direct hot meals & food packets serving needy village residents and elderly.', 'Food Distribution', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/ration-kit-food-dist/food_dist_5.png', 10, 1),
('Food Distribution Drive #6', 'Direct hot meals & food packets serving needy village residents and elderly.', 'Food Distribution', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/ration-kit-food-dist/food_dist_6.png', 11, 1),
('Food Distribution Drive #7', 'Direct hot meals & food packets serving needy village residents and elderly.', 'Food Distribution', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/ration-kit-food-dist/food_dist_7.png', 12, 1),
('Food Distribution Drive #8', 'Direct hot meals & food packets serving needy village residents and elderly.', 'Food Distribution', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/ration-kit-food-dist/food_dist_8.png', 13, 1),
('Food Distribution Drive #9', 'Direct hot meals & food packets serving needy village residents and elderly.', 'Food Distribution', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/ration-kit-food-dist/food_dist_9.png', 14, 1),
('Food Distribution Drive #10', 'Direct hot meals & food packets serving needy village residents and elderly.', 'Food Distribution', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/ration-kit-food-dist/food_dist_10.png', 15, 1),
('Food Distribution Drive #11', 'Direct hot meals & food packets serving needy village residents and elderly.', 'Food Distribution', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/ration-kit-food-dist/food_dist_11.png', 16, 1),
('Food Distribution Drive #12', 'Direct hot meals & food packets serving needy village residents and elderly.', 'Food Distribution', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/ration-kit-food-dist/food_dist_12.png', 17, 1),
('Food Distribution Drive #13', 'Direct hot meals & food packets serving needy village residents and elderly.', 'Food Distribution', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/ration-kit-food-dist/food_dist_13.png', 18, 1),
('Food Distribution Drive #14', 'Direct hot meals & food packets serving needy village residents and elderly.', 'Food Distribution', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/ration-kit-food-dist/food_dist_14.png', 19, 1),
('Food Distribution Drive #15', 'Direct hot meals & food packets serving needy village residents and elderly.', 'Food Distribution', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/ration-kit-food-dist/food_dist_15.png', 20, 1),
('Food Distribution Drive #16', 'Direct hot meals & food packets serving needy village residents and elderly.', 'Food Distribution', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/ration-kit-food-dist/food_dist_16.png', 21, 1),
('Food Distribution Drive #17', 'Direct hot meals & food packets serving needy village residents and elderly.', 'Food Distribution', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/ration-kit-food-dist/food_dist_17.png', 22, 1),
('Food Distribution Drive #18', 'Direct hot meals & food packets serving needy village residents and elderly.', 'Food Distribution', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/ration-kit-food-dist/food_dist_18.png', 23, 1),
('Food Distribution Drive #19', 'Direct hot meals & food packets serving needy village residents and elderly.', 'Food Distribution', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/ration-kit-food-dist/food_dist_19.png', 24, 1),
('Food Distribution Drive #20', 'Direct hot meals & food packets serving needy village residents and elderly.', 'Food Distribution', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/ration-kit-food-dist/food_dist_20.png', 25, 1),
('Food Distribution Drive #21', 'Direct hot meals & food packets serving needy village residents and elderly.', 'Food Distribution', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/ration-kit-food-dist/food_dist_21.png', 26, 1),
('Food Distribution Drive #22', 'Direct hot meals & food packets serving needy village residents and elderly.', 'Food Distribution', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/ration-kit-food-dist/food_dist_22.png', 27, 1),
('Food Distribution Drive #23', 'Direct hot meals & food packets serving needy village residents and elderly.', 'Food Distribution', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/ration-kit-food-dist/food_dist_23.png', 28, 1),
('Tailoring Graduation & Certificates Batch #1', 'Empowering women and widows with certified tailoring training and sewing skill recognition.', 'Education & Skill', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/certificate_group_1.png', 29, 1),
('Tailoring Graduation & Certificates Batch #2', 'Empowering women and widows with certified tailoring training and sewing skill recognition.', 'Education & Skill', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/certificate_group_2.png', 30, 1),
('Tailoring Graduation & Certificates Batch #3', 'Empowering women and widows with certified tailoring training and sewing skill recognition.', 'Education & Skill', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/certificate_group_3.png', 31, 1),
('Tailoring Graduation & Certificates Batch #4', 'Empowering women and widows with certified tailoring training and sewing skill recognition.', 'Education & Skill', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/certificate_group_4.png', 32, 1),
('Tailoring Graduation & Certificates Batch #5', 'Empowering women and widows with certified tailoring training and sewing skill recognition.', 'Education & Skill', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/certificate_group_5.png', 33, 1),
('Tailoring Training Program - certificate dist 1', 'Skill development program for underprivileged women.', 'Education & Skill', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/certificate_dist_1.png', 34, 1),
('Tailoring Training Program - certificate dist 2', 'Skill development program for underprivileged women.', 'Education & Skill', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/certificate_dist_2.png', 35, 1),
('Tailoring Training Program - certificate dist 3', 'Skill development program for underprivileged women.', 'Education & Skill', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/certificate_dist_3.png', 36, 1),
('Tailoring Training Program - certificate dist 4', 'Skill development program for underprivileged women.', 'Education & Skill', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/certificate_dist_4.png', 37, 1),
('Tailoring Training Program - certificate dist 5', 'Skill development program for underprivileged women.', 'Education & Skill', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/certificate_dist_5.png', 38, 1),
('Tailoring Training Program - certificate dist 6', 'Skill development program for underprivileged women.', 'Education & Skill', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/certificate_dist_6.png', 39, 1),
('Tailoring Training Program - certificate dist 7', 'Skill development program for underprivileged women.', 'Education & Skill', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/certificate_dist_7.png', 40, 1),
('Tailoring Training Program - certificate dist 8', 'Skill development program for underprivileged women.', 'Education & Skill', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/certificate_dist_8.png', 41, 1),
('Tailoring Training Program - certificate dist 9', 'Skill development program for underprivileged women.', 'Education & Skill', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/certificate_dist_9.png', 42, 1),
('Tailoring Training Program - certificate dist 10', 'Skill development program for underprivileged women.', 'Education & Skill', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/certificate_dist_10.png', 43, 1),
('Tailoring Training Program - certificate dist 11', 'Skill development program for underprivileged women.', 'Education & Skill', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/certificate_dist_11.png', 44, 1),
('Tailoring Training Program - class 1', 'Skill development program for underprivileged women.', 'Education & Skill', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/class_1.png', 45, 1),
('Tailoring Training Program - class 2', 'Skill development program for underprivileged women.', 'Education & Skill', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/class_2.png', 46, 1),
('Tailoring Training Program - class 3', 'Skill development program for underprivileged women.', 'Education & Skill', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/class_3.png', 47, 1),
('Tailoring Training Program - class 4', 'Skill development program for underprivileged women.', 'Education & Skill', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/class_4.png', 48, 1),
('Free Tailoring Class Session #1', 'Hands-on sewing machine practice and garment tailoring batch in Pernambut center.', 'Education & Skill', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/Training_Album_1.png', 49, 1),
('Free Tailoring Class Session #2', 'Hands-on sewing machine practice and garment tailoring batch in Pernambut center.', 'Education & Skill', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/Training_Album_2.png', 50, 1),
('Free Tailoring Class Session #3', 'Hands-on sewing machine practice and garment tailoring batch in Pernambut center.', 'Education & Skill', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/Training_Album_3.png', 51, 1),
('Free Tailoring Class Session #4', 'Hands-on sewing machine practice and garment tailoring batch in Pernambut center.', 'Education & Skill', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/Training_Album_4.png', 52, 1),
('Free Tailoring Class Session #5', 'Hands-on sewing machine practice and garment tailoring batch in Pernambut center.', 'Education & Skill', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/Training_Album_5.png', 53, 1),
('Free Tailoring Class Session #6', 'Hands-on sewing machine practice and garment tailoring batch in Pernambut center.', 'Education & Skill', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/Training_Album_6.png', 54, 1),
('Free Tailoring Class Session #7', 'Hands-on sewing machine practice and garment tailoring batch in Pernambut center.', 'Education & Skill', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/Training_Album_7.png', 55, 1),
('Free Tailoring Class Session #8', 'Hands-on sewing machine practice and garment tailoring batch in Pernambut center.', 'Education & Skill', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/Training_Album_8.png', 56, 1),
('Free Tailoring Class Session #9', 'Hands-on sewing machine practice and garment tailoring batch in Pernambut center.', 'Education & Skill', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/Training_Album_9.png', 57, 1),
('Free Tailoring Class Session #10', 'Hands-on sewing machine practice and garment tailoring batch in Pernambut center.', 'Education & Skill', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/Training_Album_10.png', 58, 1),
('Free Tailoring Class Session #11', 'Hands-on sewing machine practice and garment tailoring batch in Pernambut center.', 'Education & Skill', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/Training_Album_11.png', 59, 1),
('Free Tailoring Class Session #12', 'Hands-on sewing machine practice and garment tailoring batch in Pernambut center.', 'Education & Skill', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/Training_Album_12.png', 60, 1),
('Free Tailoring Class Session #15', 'Hands-on sewing machine practice and garment tailoring batch in Pernambut center.', 'Education & Skill', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/Training_Album_15.png', 61, 1),
('Free Tailoring Class Session #17', 'Hands-on sewing machine practice and garment tailoring batch in Pernambut center.', 'Education & Skill', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/Training_Album_17.png', 62, 1),
('Free Tailoring Class Session #20', 'Hands-on sewing machine practice and garment tailoring batch in Pernambut center.', 'Education & Skill', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/Training_Album_20.png', 63, 1),
('Free Tailoring Class Session #29', 'Hands-on sewing machine practice and garment tailoring batch in Pernambut center.', 'Education & Skill', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/Training_Album_29.png', 64, 1),
('Free Medical Camp & Checkup #1', 'Free physician consultation, BP/Sugar screening, and free essential medicines distribution.', 'Healthcare', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/medical-help/medi_camp_1.png', 65, 1),
('Free Medical Camp & Checkup #2', 'Free physician consultation, BP/Sugar screening, and free essential medicines distribution.', 'Healthcare', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/medical-help/medi_camp_2.png', 66, 1),
('Free Medical Camp & Checkup #3', 'Free physician consultation, BP/Sugar screening, and free essential medicines distribution.', 'Healthcare', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/medical-help/medi_camp_3.png', 67, 1),
('Free Medical Camp & Checkup #4', 'Free physician consultation, BP/Sugar screening, and free essential medicines distribution.', 'Healthcare', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/medical-help/medi_camp_4.png', 68, 1),
('Free Medical Camp & Checkup #5', 'Free physician consultation, BP/Sugar screening, and free essential medicines distribution.', 'Healthcare', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/medical-help/medi_camp_5.png', 69, 1),
('Free Medical Camp & Checkup #6', 'Free physician consultation, BP/Sugar screening, and free essential medicines distribution.', 'Healthcare', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/medical-help/medi_camp_6.png', 70, 1),
('Free Medical Camp & Checkup #7', 'Free physician consultation, BP/Sugar screening, and free essential medicines distribution.', 'Healthcare', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/medical-help/medi_camp_7.png', 71, 1),
('Free Medical Camp & Checkup #8', 'Free physician consultation, BP/Sugar screening, and free essential medicines distribution.', 'Healthcare', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/medical-help/medi_camp_8.png', 72, 1),
('Free Medical Camp & Checkup #9', 'Free physician consultation, BP/Sugar screening, and free essential medicines distribution.', 'Healthcare', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/medical-help/medi_camp_9.png', 73, 1),
('Free Medical Camp & Checkup #10', 'Free physician consultation, BP/Sugar screening, and free essential medicines distribution.', 'Healthcare', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/medical-help/medi_camp_10.png', 74, 1),
('Free Medical Camp & Checkup #11', 'Free physician consultation, BP/Sugar screening, and free essential medicines distribution.', 'Healthcare', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/medical-help/medi_camp_11.png', 75, 1),
('Free Medical Camp & Checkup #12', 'Free physician consultation, BP/Sugar screening, and free essential medicines distribution.', 'Healthcare', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/medical-help/medi_camp_12.png', 76, 1),
('Free Medical Camp & Checkup #13', 'Free physician consultation, BP/Sugar screening, and free essential medicines distribution.', 'Healthcare', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/medical-help/medi_camp_13.png', 77, 1),
('Free Medical Camp & Checkup #14', 'Free physician consultation, BP/Sugar screening, and free essential medicines distribution.', 'Healthcare', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/medical-help/medi_camp_14.png', 78, 1),
('Free Medical Camp & Checkup #15', 'Free physician consultation, BP/Sugar screening, and free essential medicines distribution.', 'Healthcare', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/medical-help/medi_camp_15.png', 79, 1),
('Free Medical Camp & Checkup #16', 'Free physician consultation, BP/Sugar screening, and free essential medicines distribution.', 'Healthcare', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/medical-help/medi_camp_16.png', 80, 1),
('Free Medical Camp & Checkup #17', 'Free physician consultation, BP/Sugar screening, and free essential medicines distribution.', 'Healthcare', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/medical-help/medi_camp_17.png', 81, 1),
('Free Medical Camp & Checkup #18', 'Free physician consultation, BP/Sugar screening, and free essential medicines distribution.', 'Healthcare', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/medical-help/medi_camp_18.png', 82, 1),
('Free Medical Camp & Checkup #19', 'Free physician consultation, BP/Sugar screening, and free essential medicines distribution.', 'Healthcare', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/medical-help/medi_camp_19.png', 83, 1),
('Free Medical Camp & Checkup #20', 'Free physician consultation, BP/Sugar screening, and free essential medicines distribution.', 'Healthcare', 'https://ik.imagekit.io/baaidzoik/assets/gallery-full/medical-help/medi_camp_20.png', 84, 1);

-- Seed Donations
INSERT INTO `donations` (`donor_name`, `donor_email`, `donor_phone`, `amount`, `donation_type`, `payment_method`, `transaction_id`, `status`, `receipt_number`) VALUES
('Mohammed Farhan', 'farhan@gmail.com', '+91 98450 12345', 5000.00, 'zakat', 'upi', 'UPI/2026/04819284', 'verified', 'REC-2026-001'),
('Syed Abdul Rahman', 'syed.rahman@yahoo.com', '+91 94432 98765', 2500.00, 'sadaqah', 'upi', 'UPI/2026/04918231', 'verified', 'REC-2026-002'),
('Khadija Begum', 'khadija.b@gmail.com', '+91 80156 11223', 10000.00, 'zakat', 'bank_transfer', 'NEFT-AXIS-992819', 'verified', 'REC-2026-003'),
('Irfan Khan', 'irfan.khan@outlook.com', '+91 97890 55443', 1000.00, 'general', 'upi', 'UPI/2026/05128392', 'verified', 'REC-2026-004'),
('Zainab Fatima', 'zainab.f@gmail.com', '+91 96290 88776', 3000.00, 'medical', 'upi', 'UPI/2026/05238120', 'pending', 'REC-2026-005'),
('Bilal Ahmed', 'bilal.ahmed@gmail.com', '+91 91590 33221', 7500.00, 'ration', 'bank_transfer', 'IMPS-HDFC-332910', 'verified', 'REC-2026-006'),
('Anonymous Donor', NULL, '+91 98840 00112', 2000.00, 'sadaqah', 'cash', 'CASH-REC-104', 'completed', 'REC-2026-007');

-- Seed Volunteers
INSERT INTO `volunteers` (`name`, `phone`, `email`, `address`, `occupation`, `availability`, `status`, `notes`) VALUES
('Ameen Ur Rahman', '+91 98412 34567', 'ameen@gmail.com', 'Small Mosque St, Pernambut', 'Teacher', 'Weekends & Evenings', 'approved', 'Experienced in teaching and student counseling'),
('Rashid Hussain', '+91 97891 23456', 'rashid.h@gmail.com', 'Bazaar Street, Pernambut', 'Pharmacist', 'Sunday camps', 'approved', 'Can assist during medical camps and medicine distribution'),
('Fatima Zahra', '+91 94451 98765', 'fatima.z@outlook.com', 'College Road, Pernambut', 'Fashion Designer', 'Weekdays', 'approved', 'Instructs at tailoring training center');

-- Seed Contact Inquiries
INSERT INTO `contact_inquiries` (`name`, `email`, `phone`, `subject`, `message`, `status`) VALUES
('Dr. Tariq Jameel', 'dr.tariq@gmail.com', '+91 98765 43210', 'Offer for free eye checkup camp', 'Assalamu Alaikum. I am an ophthalmologist from Vellore and would like to organize a free eye checkup and cataract screening camp with Ar Rahman Trust next month.', 'unread'),
('Aslam Pasha', 'aslam.p@yahoo.com', '+91 91234 56789', 'Tailoring machine sponsorship inquiry', 'We would like to donate 5 singer sewing machines for the women empowerment batch. Please let us know the delivery procedure.', 'read'),
('Shabana Anjum', 'shabana.a@gmail.com', '+91 99887 76655', 'Volunteering for food drive', 'Would love to volunteer with our youth team during the upcoming holiday ration drive in rural Pernambut.', 'replied');

-- Seed Trust Settings
INSERT INTO `trust_settings` (`setting_key`, `setting_value`, `description`) VALUES
('trust_name', 'Ar Rahman Trust', 'Official registered charity name'),
('reg_number', '04/16/2020', 'Government charity registration number'),
('upi_id', 'fuzailahmed536l@okaxis', 'UPI ID for QR code donations'),
('payee_name', 'Ar Rahman Trust', 'UPI Beneficiary Payee Name'),
('contact_phone', '+91 80156 65648', 'Public contact phone number'),
('contact_email', 'arrahmantrust@gmail.com', 'Official trust email address'),
('trust_address', '112, Small Mosque Street, Pernambut, Vellore District, Tamil Nadu, India', 'Headquarters address'),
('banner_announcement', 'Welcome to Ar Rahman Trust. Join us in uplifting families across Pernambut & surrounding villages.', 'Header notification banner announcement');
