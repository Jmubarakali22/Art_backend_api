-- Ar Rahman Trust Database Schema
CREATE DATABASE IF NOT EXISTS `ar_rahman_trust_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `ar_rahman_trust_db`;

-- Admins Table
CREATE TABLE IF NOT EXISTS `admins` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `role` ENUM('superadmin', 'admin', 'moderator') DEFAULT 'admin',
  `avatar` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Donations Table
CREATE TABLE IF NOT EXISTS `donations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `donor_name` VARCHAR(100) NOT NULL,
  `donor_email` VARCHAR(100) DEFAULT NULL,
  `donor_phone` VARCHAR(20) NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `donation_type` ENUM('zakat', 'sadaqah', 'general', 'education', 'medical', 'ration') DEFAULT 'sadaqah',
  `payment_method` ENUM('upi', 'bank_transfer', 'cash', 'card') DEFAULT 'upi',
  `transaction_id` VARCHAR(100) DEFAULT NULL,
  `status` ENUM('completed', 'pending', 'verified', 'failed') DEFAULT 'completed',
  `notes` TEXT DEFAULT NULL,
  `receipt_number` VARCHAR(50) UNIQUE DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Causes / Programs Table
CREATE TABLE IF NOT EXISTS `causes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(200) NOT NULL,
  `category` VARCHAR(50) NOT NULL,
  `description` TEXT NOT NULL,
  `target_amount` DECIMAL(12,2) DEFAULT 0.00,
  `raised_amount` DECIMAL(12,2) DEFAULT 0.00,
  `image_url` VARCHAR(500) DEFAULT NULL,
  `status` ENUM('active', 'completed', 'paused') DEFAULT 'active',
  `featured` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Gallery Table
CREATE TABLE IF NOT EXISTS `gallery` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(150) NOT NULL,
  `caption` VARCHAR(255) DEFAULT NULL,
  `category` VARCHAR(50) DEFAULT 'General',
  `image_url` VARCHAR(500) NOT NULL,
  `order_num` INT DEFAULT 0,
  `is_visible` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volunteers Table
CREATE TABLE IF NOT EXISTS `volunteers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `email` VARCHAR(100) DEFAULT NULL,
  `address` VARCHAR(255) DEFAULT NULL,
  `occupation` VARCHAR(100) DEFAULT NULL,
  `availability` VARCHAR(100) DEFAULT 'Weekends',
  `status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Contact Inquiries Table
CREATE TABLE IF NOT EXISTS `contact_inquiries` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(20) DEFAULT NULL,
  `subject` VARCHAR(150) DEFAULT NULL,
  `message` TEXT NOT NULL,
  `status` ENUM('unread', 'read', 'replied') DEFAULT 'unread',
  `admin_notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Trust Settings Table
CREATE TABLE IF NOT EXISTS `trust_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `setting_key` VARCHAR(100) NOT NULL UNIQUE,
  `setting_value` TEXT DEFAULT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Activity Logs Table
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `admin_id` INT DEFAULT NULL,
  `admin_name` VARCHAR(100) DEFAULT NULL,
  `action` VARCHAR(100) NOT NULL,
  `details` TEXT DEFAULT NULL,
  `ip_address` VARCHAR(50) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`admin_id`) REFERENCES `admins`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
