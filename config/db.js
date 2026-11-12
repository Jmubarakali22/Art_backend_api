const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ar_rahman_trust_db',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
};

let pool = null;
let useMemoryFallback = false;

// Initial in-memory mock store for instant testing when MySQL is not yet booted
const memoryStore = {
  admins: [
    {
      id: 1,
      username: 'arrahmantrust@gmail.com',
      email: 'arrahmantrust@gmail.com',
      password: '', // will be hashed below
      name: 'Ar-Rahman Super Admin',
      role: 'superadmin',
      avatar: null,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      username: 'trustee',
      email: 'trustee@arrahmantrust.com',
      password: '',
      name: 'Managing Trustee',
      role: 'admin',
      avatar: null,
      created_at: new Date().toISOString()
    }
  ],
  causes: [
    {
      id: 1,
      title: 'Daily Food Distribution Drive',
      category: 'Food Relief',
      description: 'Providing hot nutritious meals and monthly dry food kits to needy families in Pernambut and surrounding rural villages.',
      target_amount: 150000,
      raised_amount: 98500,
      image_url: 'https://ik.imagekit.io/baaidzoik/assets/gallery/AR_food_dist.png',
      status: 'active',
      featured: 1,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      title: 'Free Tailoring Training Center for Women',
      category: 'Women Empowerment',
      description: 'Equipping underprivileged women and widows with certified tailoring, sewing machine mastery, and self-employment skills.',
      target_amount: 100000,
      raised_amount: 75000,
      image_url: 'https://ik.imagekit.io/baaidzoik/assets/gallery/AR_tailoring_class.png',
      status: 'active',
      featured: 1,
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      title: 'Free Medicine & Regular Medical Camps',
      category: 'Healthcare',
      description: 'Conducting weekly health check-up camps, free diagnostic tests, and supplying essential medicines to elderly and sick villagers.',
      target_amount: 200000,
      raised_amount: 142000,
      image_url: 'https://ik.imagekit.io/baaidzoik/assets/gallery/AR_medical_help.png',
      status: 'active',
      featured: 1,
      created_at: new Date().toISOString()
    },
    {
      id: 4,
      title: 'Needy & Orphan Students Education Fund',
      category: 'Education',
      description: 'Sponsoring school fees, textbooks, uniforms, and stationery supplies for deserving students from low-income families.',
      target_amount: 120000,
      raised_amount: 68000,
      image_url: 'https://ik.imagekit.io/baaidzoik/assets/gallery/AR_food_dist.png',
      status: 'active',
      featured: 0,
      created_at: new Date().toISOString()
    }
  ],
  gallery: [
    {
        "id": 1,
        "title": "Ration Kit Distribution #1",
        "caption": "Monthly essential food & grocery kit distribution to underprivileged families in Pernambut.",
        "category": "Food Distribution",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/ration-kit-food-dist/ration_kit_1.png",
        "order_num": 1,
        "is_visible": 1,
        "created_at": "2026-10-31T00:19:56.796Z"
    },
    {
        "id": 2,
        "title": "Ration Kit Distribution #2",
        "caption": "Monthly essential food & grocery kit distribution to underprivileged families in Pernambut.",
        "category": "Food Distribution",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/ration-kit-food-dist/ration_kit_2.png",
        "order_num": 2,
        "is_visible": 1,
        "created_at": "2026-10-31T01:19:56.797Z"
    },
    {
        "id": 3,
        "title": "Ration Kit Distribution #3",
        "caption": "Monthly essential food & grocery kit distribution to underprivileged families in Pernambut.",
        "category": "Food Distribution",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/ration-kit-food-dist/ration_kit_3.png",
        "order_num": 3,
        "is_visible": 1,
        "created_at": "2026-10-31T02:19:56.797Z"
    },
    {
        "id": 4,
        "title": "Ration Kit Distribution #4",
        "caption": "Monthly essential food & grocery kit distribution to underprivileged families in Pernambut.",
        "category": "Food Distribution",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/ration-kit-food-dist/ration_kit_4.png",
        "order_num": 4,
        "is_visible": 1,
        "created_at": "2026-10-31T03:19:56.797Z"
    },
    {
        "id": 5,
        "title": "Ration Kit Distribution #5",
        "caption": "Monthly essential food & grocery kit distribution to underprivileged families in Pernambut.",
        "category": "Food Distribution",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/ration-kit-food-dist/ration_kit_5.png",
        "order_num": 5,
        "is_visible": 1,
        "created_at": "2026-10-31T04:19:56.797Z"
    },
    {
        "id": 6,
        "title": "Food Distribution Drive #1",
        "caption": "Direct hot meals & food packets serving needy village residents and elderly.",
        "category": "Food Distribution",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/ration-kit-food-dist/food_dist_1.png",
        "order_num": 6,
        "is_visible": 1,
        "created_at": "2026-10-31T05:19:56.797Z"
    },
    {
        "id": 7,
        "title": "Food Distribution Drive #2",
        "caption": "Direct hot meals & food packets serving needy village residents and elderly.",
        "category": "Food Distribution",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/ration-kit-food-dist/food_dist_2.png",
        "order_num": 7,
        "is_visible": 1,
        "created_at": "2026-10-31T06:19:56.797Z"
    },
    {
        "id": 8,
        "title": "Food Distribution Drive #3",
        "caption": "Direct hot meals & food packets serving needy village residents and elderly.",
        "category": "Food Distribution",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/ration-kit-food-dist/food_dist_3.png",
        "order_num": 8,
        "is_visible": 1,
        "created_at": "2026-10-31T07:19:56.797Z"
    },
    {
        "id": 9,
        "title": "Food Distribution Drive #4",
        "caption": "Direct hot meals & food packets serving needy village residents and elderly.",
        "category": "Food Distribution",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/ration-kit-food-dist/food_dist_4.png",
        "order_num": 9,
        "is_visible": 1,
        "created_at": "2026-10-31T08:19:56.797Z"
    },
    {
        "id": 10,
        "title": "Food Distribution Drive #5",
        "caption": "Direct hot meals & food packets serving needy village residents and elderly.",
        "category": "Food Distribution",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/ration-kit-food-dist/food_dist_5.png",
        "order_num": 10,
        "is_visible": 1,
        "created_at": "2026-10-31T09:19:56.797Z"
    },
    {
        "id": 11,
        "title": "Food Distribution Drive #6",
        "caption": "Direct hot meals & food packets serving needy village residents and elderly.",
        "category": "Food Distribution",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/ration-kit-food-dist/food_dist_6.png",
        "order_num": 11,
        "is_visible": 1,
        "created_at": "2026-10-31T10:19:56.797Z"
    },
    {
        "id": 12,
        "title": "Food Distribution Drive #7",
        "caption": "Direct hot meals & food packets serving needy village residents and elderly.",
        "category": "Food Distribution",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/ration-kit-food-dist/food_dist_7.png",
        "order_num": 12,
        "is_visible": 1,
        "created_at": "2026-10-31T11:19:56.797Z"
    },
    {
        "id": 13,
        "title": "Food Distribution Drive #8",
        "caption": "Direct hot meals & food packets serving needy village residents and elderly.",
        "category": "Food Distribution",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/ration-kit-food-dist/food_dist_8.png",
        "order_num": 13,
        "is_visible": 1,
        "created_at": "2026-10-31T12:19:56.797Z"
    },
    {
        "id": 14,
        "title": "Food Distribution Drive #9",
        "caption": "Direct hot meals & food packets serving needy village residents and elderly.",
        "category": "Food Distribution",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/ration-kit-food-dist/food_dist_9.png",
        "order_num": 14,
        "is_visible": 1,
        "created_at": "2026-10-31T13:19:56.797Z"
    },
    {
        "id": 15,
        "title": "Food Distribution Drive #10",
        "caption": "Direct hot meals & food packets serving needy village residents and elderly.",
        "category": "Food Distribution",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/ration-kit-food-dist/food_dist_10.png",
        "order_num": 15,
        "is_visible": 1,
        "created_at": "2026-10-31T14:19:56.797Z"
    },
    {
        "id": 16,
        "title": "Food Distribution Drive #11",
        "caption": "Direct hot meals & food packets serving needy village residents and elderly.",
        "category": "Food Distribution",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/ration-kit-food-dist/food_dist_11.png",
        "order_num": 16,
        "is_visible": 1,
        "created_at": "2026-10-31T15:19:56.797Z"
    },
    {
        "id": 17,
        "title": "Food Distribution Drive #12",
        "caption": "Direct hot meals & food packets serving needy village residents and elderly.",
        "category": "Food Distribution",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/ration-kit-food-dist/food_dist_12.png",
        "order_num": 17,
        "is_visible": 1,
        "created_at": "2026-10-31T16:19:56.797Z"
    },
    {
        "id": 18,
        "title": "Food Distribution Drive #13",
        "caption": "Direct hot meals & food packets serving needy village residents and elderly.",
        "category": "Food Distribution",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/ration-kit-food-dist/food_dist_13.png",
        "order_num": 18,
        "is_visible": 1,
        "created_at": "2026-10-31T17:19:56.797Z"
    },
    {
        "id": 19,
        "title": "Food Distribution Drive #14",
        "caption": "Direct hot meals & food packets serving needy village residents and elderly.",
        "category": "Food Distribution",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/ration-kit-food-dist/food_dist_14.png",
        "order_num": 19,
        "is_visible": 1,
        "created_at": "2026-10-31T18:19:56.797Z"
    },
    {
        "id": 20,
        "title": "Food Distribution Drive #15",
        "caption": "Direct hot meals & food packets serving needy village residents and elderly.",
        "category": "Food Distribution",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/ration-kit-food-dist/food_dist_15.png",
        "order_num": 20,
        "is_visible": 1,
        "created_at": "2026-10-31T19:19:56.797Z"
    },
    {
        "id": 21,
        "title": "Food Distribution Drive #16",
        "caption": "Direct hot meals & food packets serving needy village residents and elderly.",
        "category": "Food Distribution",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/ration-kit-food-dist/food_dist_16.png",
        "order_num": 21,
        "is_visible": 1,
        "created_at": "2026-10-31T20:19:56.797Z"
    },
    {
        "id": 22,
        "title": "Food Distribution Drive #17",
        "caption": "Direct hot meals & food packets serving needy village residents and elderly.",
        "category": "Food Distribution",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/ration-kit-food-dist/food_dist_17.png",
        "order_num": 22,
        "is_visible": 1,
        "created_at": "2026-10-31T21:19:56.797Z"
    },
    {
        "id": 23,
        "title": "Food Distribution Drive #18",
        "caption": "Direct hot meals & food packets serving needy village residents and elderly.",
        "category": "Food Distribution",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/ration-kit-food-dist/food_dist_18.png",
        "order_num": 23,
        "is_visible": 1,
        "created_at": "2026-10-31T22:19:56.797Z"
    },
    {
        "id": 24,
        "title": "Food Distribution Drive #19",
        "caption": "Direct hot meals & food packets serving needy village residents and elderly.",
        "category": "Food Distribution",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/ration-kit-food-dist/food_dist_19.png",
        "order_num": 24,
        "is_visible": 1,
        "created_at": "2026-10-31T23:19:56.797Z"
    },
    {
        "id": 25,
        "title": "Food Distribution Drive #20",
        "caption": "Direct hot meals & food packets serving needy village residents and elderly.",
        "category": "Food Distribution",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/ration-kit-food-dist/food_dist_20.png",
        "order_num": 25,
        "is_visible": 1,
        "created_at": "2026-11-01T00:19:56.797Z"
    },
    {
        "id": 26,
        "title": "Food Distribution Drive #21",
        "caption": "Direct hot meals & food packets serving needy village residents and elderly.",
        "category": "Food Distribution",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/ration-kit-food-dist/food_dist_21.png",
        "order_num": 26,
        "is_visible": 1,
        "created_at": "2026-11-01T01:19:56.797Z"
    },
    {
        "id": 27,
        "title": "Food Distribution Drive #22",
        "caption": "Direct hot meals & food packets serving needy village residents and elderly.",
        "category": "Food Distribution",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/ration-kit-food-dist/food_dist_22.png",
        "order_num": 27,
        "is_visible": 1,
        "created_at": "2026-11-01T02:19:56.797Z"
    },
    {
        "id": 28,
        "title": "Food Distribution Drive #23",
        "caption": "Direct hot meals & food packets serving needy village residents and elderly.",
        "category": "Food Distribution",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/ration-kit-food-dist/food_dist_23.png",
        "order_num": 28,
        "is_visible": 1,
        "created_at": "2026-11-01T03:19:56.797Z"
    },
    {
        "id": 29,
        "title": "Tailoring Graduation & Certificates Batch #1",
        "caption": "Empowering women and widows with certified tailoring training and sewing skill recognition.",
        "category": "Education & Skill",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/certificate_group_1.png",
        "order_num": 29,
        "is_visible": 1,
        "created_at": "2026-11-01T04:19:56.797Z"
    },
    {
        "id": 30,
        "title": "Tailoring Graduation & Certificates Batch #2",
        "caption": "Empowering women and widows with certified tailoring training and sewing skill recognition.",
        "category": "Education & Skill",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/certificate_group_2.png",
        "order_num": 30,
        "is_visible": 1,
        "created_at": "2026-11-01T05:19:56.797Z"
    },
    {
        "id": 31,
        "title": "Tailoring Graduation & Certificates Batch #3",
        "caption": "Empowering women and widows with certified tailoring training and sewing skill recognition.",
        "category": "Education & Skill",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/certificate_group_3.png",
        "order_num": 31,
        "is_visible": 1,
        "created_at": "2026-11-01T06:19:56.797Z"
    },
    {
        "id": 32,
        "title": "Tailoring Graduation & Certificates Batch #4",
        "caption": "Empowering women and widows with certified tailoring training and sewing skill recognition.",
        "category": "Education & Skill",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/certificate_group_4.png",
        "order_num": 32,
        "is_visible": 1,
        "created_at": "2026-11-01T07:19:56.797Z"
    },
    {
        "id": 33,
        "title": "Tailoring Graduation & Certificates Batch #5",
        "caption": "Empowering women and widows with certified tailoring training and sewing skill recognition.",
        "category": "Education & Skill",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/certificate_group_5.png",
        "order_num": 33,
        "is_visible": 1,
        "created_at": "2026-11-01T08:19:56.797Z"
    },
    {
        "id": 34,
        "title": "Tailoring Training Program - certificate dist 1",
        "caption": "Skill development program for underprivileged women.",
        "category": "Education & Skill",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/certificate_dist_1.png",
        "order_num": 34,
        "is_visible": 1,
        "created_at": "2026-11-01T09:19:56.797Z"
    },
    {
        "id": 35,
        "title": "Tailoring Training Program - certificate dist 2",
        "caption": "Skill development program for underprivileged women.",
        "category": "Education & Skill",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/certificate_dist_2.png",
        "order_num": 35,
        "is_visible": 1,
        "created_at": "2026-11-01T10:19:56.797Z"
    },
    {
        "id": 36,
        "title": "Tailoring Training Program - certificate dist 3",
        "caption": "Skill development program for underprivileged women.",
        "category": "Education & Skill",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/certificate_dist_3.png",
        "order_num": 36,
        "is_visible": 1,
        "created_at": "2026-11-01T11:19:56.797Z"
    },
    {
        "id": 37,
        "title": "Tailoring Training Program - certificate dist 4",
        "caption": "Skill development program for underprivileged women.",
        "category": "Education & Skill",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/certificate_dist_4.png",
        "order_num": 37,
        "is_visible": 1,
        "created_at": "2026-11-01T12:19:56.797Z"
    },
    {
        "id": 38,
        "title": "Tailoring Training Program - certificate dist 5",
        "caption": "Skill development program for underprivileged women.",
        "category": "Education & Skill",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/certificate_dist_5.png",
        "order_num": 38,
        "is_visible": 1,
        "created_at": "2026-11-01T13:19:56.797Z"
    },
    {
        "id": 39,
        "title": "Tailoring Training Program - certificate dist 6",
        "caption": "Skill development program for underprivileged women.",
        "category": "Education & Skill",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/certificate_dist_6.png",
        "order_num": 39,
        "is_visible": 1,
        "created_at": "2026-11-01T14:19:56.797Z"
    },
    {
        "id": 40,
        "title": "Tailoring Training Program - certificate dist 7",
        "caption": "Skill development program for underprivileged women.",
        "category": "Education & Skill",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/certificate_dist_7.png",
        "order_num": 40,
        "is_visible": 1,
        "created_at": "2026-11-01T15:19:56.797Z"
    },
    {
        "id": 41,
        "title": "Tailoring Training Program - certificate dist 8",
        "caption": "Skill development program for underprivileged women.",
        "category": "Education & Skill",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/certificate_dist_8.png",
        "order_num": 41,
        "is_visible": 1,
        "created_at": "2026-11-01T16:19:56.797Z"
    },
    {
        "id": 42,
        "title": "Tailoring Training Program - certificate dist 9",
        "caption": "Skill development program for underprivileged women.",
        "category": "Education & Skill",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/certificate_dist_9.png",
        "order_num": 42,
        "is_visible": 1,
        "created_at": "2026-11-01T17:19:56.797Z"
    },
    {
        "id": 43,
        "title": "Tailoring Training Program - certificate dist 10",
        "caption": "Skill development program for underprivileged women.",
        "category": "Education & Skill",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/certificate_dist_10.png",
        "order_num": 43,
        "is_visible": 1,
        "created_at": "2026-11-01T18:19:56.797Z"
    },
    {
        "id": 44,
        "title": "Tailoring Training Program - certificate dist 11",
        "caption": "Skill development program for underprivileged women.",
        "category": "Education & Skill",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/certificate_dist_11.png",
        "order_num": 44,
        "is_visible": 1,
        "created_at": "2026-11-01T19:19:56.797Z"
    },
    {
        "id": 45,
        "title": "Tailoring Training Program - class 1",
        "caption": "Skill development program for underprivileged women.",
        "category": "Education & Skill",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/class_1.png",
        "order_num": 45,
        "is_visible": 1,
        "created_at": "2026-11-01T20:19:56.797Z"
    },
    {
        "id": 46,
        "title": "Tailoring Training Program - class 2",
        "caption": "Skill development program for underprivileged women.",
        "category": "Education & Skill",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/class_2.png",
        "order_num": 46,
        "is_visible": 1,
        "created_at": "2026-11-01T21:19:56.797Z"
    },
    {
        "id": 47,
        "title": "Tailoring Training Program - class 3",
        "caption": "Skill development program for underprivileged women.",
        "category": "Education & Skill",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/class_3.png",
        "order_num": 47,
        "is_visible": 1,
        "created_at": "2026-11-01T22:19:56.797Z"
    },
    {
        "id": 48,
        "title": "Tailoring Training Program - class 4",
        "caption": "Skill development program for underprivileged women.",
        "category": "Education & Skill",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/class_4.png",
        "order_num": 48,
        "is_visible": 1,
        "created_at": "2026-11-01T23:19:56.797Z"
    },
    {
        "id": 49,
        "title": "Free Tailoring Class Session #1",
        "caption": "Hands-on sewing machine practice and garment tailoring batch in Pernambut center.",
        "category": "Education & Skill",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/Training_Album_1.png",
        "order_num": 49,
        "is_visible": 1,
        "created_at": "2026-11-02T00:19:56.797Z"
    },
    {
        "id": 50,
        "title": "Free Tailoring Class Session #2",
        "caption": "Hands-on sewing machine practice and garment tailoring batch in Pernambut center.",
        "category": "Education & Skill",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/Training_Album_2.png",
        "order_num": 50,
        "is_visible": 1,
        "created_at": "2026-11-02T01:19:56.797Z"
    },
    {
        "id": 51,
        "title": "Free Tailoring Class Session #3",
        "caption": "Hands-on sewing machine practice and garment tailoring batch in Pernambut center.",
        "category": "Education & Skill",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/Training_Album_3.png",
        "order_num": 51,
        "is_visible": 1,
        "created_at": "2026-11-02T02:19:56.797Z"
    },
    {
        "id": 52,
        "title": "Free Tailoring Class Session #4",
        "caption": "Hands-on sewing machine practice and garment tailoring batch in Pernambut center.",
        "category": "Education & Skill",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/Training_Album_4.png",
        "order_num": 52,
        "is_visible": 1,
        "created_at": "2026-11-02T03:19:56.797Z"
    },
    {
        "id": 53,
        "title": "Free Tailoring Class Session #5",
        "caption": "Hands-on sewing machine practice and garment tailoring batch in Pernambut center.",
        "category": "Education & Skill",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/Training_Album_5.png",
        "order_num": 53,
        "is_visible": 1,
        "created_at": "2026-11-02T04:19:56.797Z"
    },
    {
        "id": 54,
        "title": "Free Tailoring Class Session #6",
        "caption": "Hands-on sewing machine practice and garment tailoring batch in Pernambut center.",
        "category": "Education & Skill",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/Training_Album_6.png",
        "order_num": 54,
        "is_visible": 1,
        "created_at": "2026-11-02T05:19:56.797Z"
    },
    {
        "id": 55,
        "title": "Free Tailoring Class Session #7",
        "caption": "Hands-on sewing machine practice and garment tailoring batch in Pernambut center.",
        "category": "Education & Skill",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/Training_Album_7.png",
        "order_num": 55,
        "is_visible": 1,
        "created_at": "2026-11-02T06:19:56.797Z"
    },
    {
        "id": 56,
        "title": "Free Tailoring Class Session #8",
        "caption": "Hands-on sewing machine practice and garment tailoring batch in Pernambut center.",
        "category": "Education & Skill",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/Training_Album_8.png",
        "order_num": 56,
        "is_visible": 1,
        "created_at": "2026-11-02T07:19:56.797Z"
    },
    {
        "id": 57,
        "title": "Free Tailoring Class Session #9",
        "caption": "Hands-on sewing machine practice and garment tailoring batch in Pernambut center.",
        "category": "Education & Skill",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/Training_Album_9.png",
        "order_num": 57,
        "is_visible": 1,
        "created_at": "2026-11-02T08:19:56.797Z"
    },
    {
        "id": 58,
        "title": "Free Tailoring Class Session #10",
        "caption": "Hands-on sewing machine practice and garment tailoring batch in Pernambut center.",
        "category": "Education & Skill",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/Training_Album_10.png",
        "order_num": 58,
        "is_visible": 1,
        "created_at": "2026-11-02T09:19:56.797Z"
    },
    {
        "id": 59,
        "title": "Free Tailoring Class Session #11",
        "caption": "Hands-on sewing machine practice and garment tailoring batch in Pernambut center.",
        "category": "Education & Skill",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/Training_Album_11.png",
        "order_num": 59,
        "is_visible": 1,
        "created_at": "2026-11-02T10:19:56.797Z"
    },
    {
        "id": 60,
        "title": "Free Tailoring Class Session #12",
        "caption": "Hands-on sewing machine practice and garment tailoring batch in Pernambut center.",
        "category": "Education & Skill",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/Training_Album_12.png",
        "order_num": 60,
        "is_visible": 1,
        "created_at": "2026-11-02T11:19:56.797Z"
    },
    {
        "id": 61,
        "title": "Free Tailoring Class Session #15",
        "caption": "Hands-on sewing machine practice and garment tailoring batch in Pernambut center.",
        "category": "Education & Skill",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/Training_Album_15.png",
        "order_num": 61,
        "is_visible": 1,
        "created_at": "2026-11-02T12:19:56.797Z"
    },
    {
        "id": 62,
        "title": "Free Tailoring Class Session #17",
        "caption": "Hands-on sewing machine practice and garment tailoring batch in Pernambut center.",
        "category": "Education & Skill",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/Training_Album_17.png",
        "order_num": 62,
        "is_visible": 1,
        "created_at": "2026-11-02T13:19:56.797Z"
    },
    {
        "id": 63,
        "title": "Free Tailoring Class Session #20",
        "caption": "Hands-on sewing machine practice and garment tailoring batch in Pernambut center.",
        "category": "Education & Skill",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/Training_Album_20.png",
        "order_num": 63,
        "is_visible": 1,
        "created_at": "2026-11-02T14:19:56.797Z"
    },
    {
        "id": 64,
        "title": "Free Tailoring Class Session #29",
        "caption": "Hands-on sewing machine practice and garment tailoring batch in Pernambut center.",
        "category": "Education & Skill",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/tailoring-class/Training_Album_29.png",
        "order_num": 64,
        "is_visible": 1,
        "created_at": "2026-11-02T15:19:56.797Z"
    },
    {
        "id": 65,
        "title": "Free Medical Camp & Checkup #1",
        "caption": "Free physician consultation, BP/Sugar screening, and free essential medicines distribution.",
        "category": "Healthcare",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/medical-help/medi_camp_1.png",
        "order_num": 65,
        "is_visible": 1,
        "created_at": "2026-11-02T16:19:56.797Z"
    },
    {
        "id": 66,
        "title": "Free Medical Camp & Checkup #2",
        "caption": "Free physician consultation, BP/Sugar screening, and free essential medicines distribution.",
        "category": "Healthcare",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/medical-help/medi_camp_2.png",
        "order_num": 66,
        "is_visible": 1,
        "created_at": "2026-11-02T17:19:56.797Z"
    },
    {
        "id": 67,
        "title": "Free Medical Camp & Checkup #3",
        "caption": "Free physician consultation, BP/Sugar screening, and free essential medicines distribution.",
        "category": "Healthcare",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/medical-help/medi_camp_3.png",
        "order_num": 67,
        "is_visible": 1,
        "created_at": "2026-11-02T18:19:56.797Z"
    },
    {
        "id": 68,
        "title": "Free Medical Camp & Checkup #4",
        "caption": "Free physician consultation, BP/Sugar screening, and free essential medicines distribution.",
        "category": "Healthcare",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/medical-help/medi_camp_4.png",
        "order_num": 68,
        "is_visible": 1,
        "created_at": "2026-11-02T19:19:56.797Z"
    },
    {
        "id": 69,
        "title": "Free Medical Camp & Checkup #5",
        "caption": "Free physician consultation, BP/Sugar screening, and free essential medicines distribution.",
        "category": "Healthcare",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/medical-help/medi_camp_5.png",
        "order_num": 69,
        "is_visible": 1,
        "created_at": "2026-11-02T20:19:56.797Z"
    },
    {
        "id": 70,
        "title": "Free Medical Camp & Checkup #6",
        "caption": "Free physician consultation, BP/Sugar screening, and free essential medicines distribution.",
        "category": "Healthcare",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/medical-help/medi_camp_6.png",
        "order_num": 70,
        "is_visible": 1,
        "created_at": "2026-11-02T21:19:56.797Z"
    },
    {
        "id": 71,
        "title": "Free Medical Camp & Checkup #7",
        "caption": "Free physician consultation, BP/Sugar screening, and free essential medicines distribution.",
        "category": "Healthcare",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/medical-help/medi_camp_7.png",
        "order_num": 71,
        "is_visible": 1,
        "created_at": "2026-11-02T22:19:56.797Z"
    },
    {
        "id": 72,
        "title": "Free Medical Camp & Checkup #8",
        "caption": "Free physician consultation, BP/Sugar screening, and free essential medicines distribution.",
        "category": "Healthcare",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/medical-help/medi_camp_8.png",
        "order_num": 72,
        "is_visible": 1,
        "created_at": "2026-11-02T23:19:56.797Z"
    },
    {
        "id": 73,
        "title": "Free Medical Camp & Checkup #9",
        "caption": "Free physician consultation, BP/Sugar screening, and free essential medicines distribution.",
        "category": "Healthcare",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/medical-help/medi_camp_9.png",
        "order_num": 73,
        "is_visible": 1,
        "created_at": "2026-11-03T00:19:56.797Z"
    },
    {
        "id": 74,
        "title": "Free Medical Camp & Checkup #10",
        "caption": "Free physician consultation, BP/Sugar screening, and free essential medicines distribution.",
        "category": "Healthcare",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/medical-help/medi_camp_10.png",
        "order_num": 74,
        "is_visible": 1,
        "created_at": "2026-11-03T01:19:56.797Z"
    },
    {
        "id": 75,
        "title": "Free Medical Camp & Checkup #11",
        "caption": "Free physician consultation, BP/Sugar screening, and free essential medicines distribution.",
        "category": "Healthcare",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/medical-help/medi_camp_11.png",
        "order_num": 75,
        "is_visible": 1,
        "created_at": "2026-11-03T02:19:56.797Z"
    },
    {
        "id": 76,
        "title": "Free Medical Camp & Checkup #12",
        "caption": "Free physician consultation, BP/Sugar screening, and free essential medicines distribution.",
        "category": "Healthcare",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/medical-help/medi_camp_12.png",
        "order_num": 76,
        "is_visible": 1,
        "created_at": "2026-11-03T03:19:56.797Z"
    },
    {
        "id": 77,
        "title": "Free Medical Camp & Checkup #13",
        "caption": "Free physician consultation, BP/Sugar screening, and free essential medicines distribution.",
        "category": "Healthcare",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/medical-help/medi_camp_13.png",
        "order_num": 77,
        "is_visible": 1,
        "created_at": "2026-11-03T04:19:56.797Z"
    },
    {
        "id": 78,
        "title": "Free Medical Camp & Checkup #14",
        "caption": "Free physician consultation, BP/Sugar screening, and free essential medicines distribution.",
        "category": "Healthcare",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/medical-help/medi_camp_14.png",
        "order_num": 78,
        "is_visible": 1,
        "created_at": "2026-11-03T05:19:56.797Z"
    },
    {
        "id": 79,
        "title": "Free Medical Camp & Checkup #15",
        "caption": "Free physician consultation, BP/Sugar screening, and free essential medicines distribution.",
        "category": "Healthcare",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/medical-help/medi_camp_15.png",
        "order_num": 79,
        "is_visible": 1,
        "created_at": "2026-11-03T06:19:56.797Z"
    },
    {
        "id": 80,
        "title": "Free Medical Camp & Checkup #16",
        "caption": "Free physician consultation, BP/Sugar screening, and free essential medicines distribution.",
        "category": "Healthcare",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/medical-help/medi_camp_16.png",
        "order_num": 80,
        "is_visible": 1,
        "created_at": "2026-11-03T07:19:56.797Z"
    },
    {
        "id": 81,
        "title": "Free Medical Camp & Checkup #17",
        "caption": "Free physician consultation, BP/Sugar screening, and free essential medicines distribution.",
        "category": "Healthcare",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/medical-help/medi_camp_17.png",
        "order_num": 81,
        "is_visible": 1,
        "created_at": "2026-11-03T08:19:56.797Z"
    },
    {
        "id": 82,
        "title": "Free Medical Camp & Checkup #18",
        "caption": "Free physician consultation, BP/Sugar screening, and free essential medicines distribution.",
        "category": "Healthcare",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/medical-help/medi_camp_18.png",
        "order_num": 82,
        "is_visible": 1,
        "created_at": "2026-11-03T09:19:56.797Z"
    },
    {
        "id": 83,
        "title": "Free Medical Camp & Checkup #19",
        "caption": "Free physician consultation, BP/Sugar screening, and free essential medicines distribution.",
        "category": "Healthcare",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/medical-help/medi_camp_19.png",
        "order_num": 83,
        "is_visible": 1,
        "created_at": "2026-11-03T10:19:56.797Z"
    },
    {
        "id": 84,
        "title": "Free Medical Camp & Checkup #20",
        "caption": "Free physician consultation, BP/Sugar screening, and free essential medicines distribution.",
        "category": "Healthcare",
        "image_url": "https://ik.imagekit.io/baaidzoik/assets/gallery-full/medical-help/medi_camp_20.png",
        "order_num": 84,
        "is_visible": 1,
        "created_at": "2026-11-03T11:19:56.797Z"
    }
],
  donations: [
    {
      id: 1,
      donor_name: 'Mohammed Farhan',
      donor_email: 'farhan@gmail.com',
      donor_phone: '+91 98450 12345',
      amount: 5000,
      donation_type: 'zakat',
      payment_method: 'upi',
      transaction_id: 'UPI/2026/04819284',
      status: 'verified',
      receipt_number: 'ART20260001',
      notes: 'Zakat al-Mal contribution',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
      id: 2,
      donor_name: 'Syed Abdul Rahman',
      donor_email: 'syed.rahman@yahoo.com',
      donor_phone: '+91 94432 98765',
      amount: 2500,
      donation_type: 'sadaqah',
      payment_method: 'upi',
      transaction_id: 'UPI/2026/04918231',
      status: 'verified',
      receipt_number: 'ART20260002',
      notes: 'For tailoring center supplies',
      created_at: new Date(Date.now() - 86400000 * 4).toISOString()
    },
    {
      id: 3,
      donor_name: 'Khadija Begum',
      donor_email: 'khadija.b@gmail.com',
      donor_phone: '+91 80156 11223',
      amount: 10000,
      donation_type: 'zakat',
      payment_method: 'bank_transfer',
      transaction_id: 'NEFT-AXIS-992819',
      status: 'verified',
      receipt_number: 'ART20260003',
      notes: 'Annual Zakat donation',
      created_at: new Date(Date.now() - 86400000 * 6).toISOString()
    },
    {
      id: 4,
      donor_name: 'Irfan Khan',
      donor_email: 'irfan.khan@outlook.com',
      donor_phone: '+91 97890 55443',
      amount: 1000,
      donation_type: 'monthly_contribution',
      payment_method: 'upi',
      transaction_id: 'UPI/2026/05128392',
      status: 'verified',
      receipt_number: 'ART20260004',
      notes: 'Regular monthly sponsorship',
      created_at: new Date(Date.now() - 86400000 * 8).toISOString()
    },
    {
      id: 5,
      donor_name: 'Zainab Fatima',
      donor_email: 'zainab.f@gmail.com',
      donor_phone: '+91 96290 88776',
      amount: 3000,
      donation_type: 'sadaqah',
      payment_method: 'upi',
      transaction_id: 'UPI/2026/05238120',
      status: 'pending',
      receipt_number: 'ART20260005',
      notes: 'For Sunday free clinic medicines',
      created_at: new Date().toISOString()
    }
  ],
  volunteers: [
    {
      id: 1,
      name: 'Ameen Ur Rahman',
      phone: '+91 98412 34567',
      email: 'ameen@gmail.com',
      address: 'Small Mosque St, Pernambut',
      occupation: 'Teacher',
      availability: 'Weekends & Evenings',
      status: 'approved',
      notes: 'Experienced in teaching and counseling',
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      name: 'Rashid Hussain',
      phone: '+91 97891 23456',
      email: 'rashid.h@gmail.com',
      address: 'Bazaar Street, Pernambut',
      occupation: 'Pharmacist',
      availability: 'Sunday camps',
      status: 'approved',
      notes: 'Helps in medicine dispensing at medical camp',
      created_at: new Date().toISOString()
    }
  ],
  contact_inquiries: [
    {
      id: 1,
      name: 'Dr. Tariq Jameel',
      email: 'dr.tariq@gmail.com',
      phone: '+91 98765 43210',
      subject: 'Offer for free eye checkup camp',
      message: 'Assalamu Alaikum. I am an ophthalmologist from Vellore and would like to organize a free eye checkup camp with Ar Rahman Trust next month.',
      status: 'unread',
      admin_notes: null,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      name: 'Aslam Pasha',
      email: 'aslam.p@yahoo.com',
      phone: '+91 91234 56789',
      subject: 'Tailoring machine sponsorship inquiry',
      message: 'We would like to donate 5 singer sewing machines for the women empowerment batch.',
      status: 'read',
      admin_notes: 'Spoke on phone, will coordinate delivery next Monday.',
      created_at: new Date(Date.now() - 86400000).toISOString()
    }
  ],
  trust_settings: {
    trust_name: 'Ar Rahman Trust',
    reg_number: '04/16/2020',
    upi_id: 'fuzailahmed536l@okaxis',
    payee_name: 'Ar Rahman Trust',
    contact_phone: '+91 80156 65648',
    contact_email: 'arrahmantrust@gmail.com',
    trust_address: '112, Small Mosque Street, Pernambut, Vellore District, Tamil Nadu, India',
    banner_announcement: 'Welcome to Ar Rahman Trust. Serving Pernambut and surrounding rural villages.'
  },
  activity_logs: [
    {
      id: 1,
      admin_id: 1,
      admin_name: 'Ar-Rahman Super Admin',
      action: 'SYSTEM_INIT',
      details: 'Ar Rahman Trust Admin Panel started',
      ip_address: '127.0.0.1',
      created_at: new Date().toISOString()
    }
  ]
};

// Pre-hash default admin password
bcrypt.hash('786@arrahman', 10).then(hash => {
  memoryStore.admins[0].password = hash;
  memoryStore.admins[1].password = hash;
});

async function getPool() {
  if (pool) return pool;

  try {
    pool = mysql.createPool(dbConfig);
    // Verify connection by running a ping query
    await pool.query('SELECT 1');
    console.log(`[Database] ✅ MySQL connected successfully to "${dbConfig.database}" at ${dbConfig.host}:${dbConfig.port}`);
    useMemoryFallback = false;
    return pool;
  } catch (err) {
    useMemoryFallback = true;
    console.warn(`[Database Notice] MySQL connection on ${dbConfig.host}:${dbConfig.port} failed (${err.message}).`);
    console.warn(`[Database Notice] Operating in-memory with preloaded Ar Rahman Trust data.`);
    return null;
  }
}

async function query(sql, params = []) {
  try {
    const p = await getPool();
    if (p && !useMemoryFallback) {
      const [results] = await p.execute(sql, params);
      return results;
    }
  } catch (err) {
    useMemoryFallback = true;
  }

  // Fallback simulator for standard operations when MySQL is offline
  return handleMemoryQuery(sql, params);
}

function handleMemoryQuery(sql, params) {
  const s = sql.trim().toLowerCase();

  // Dashboard Aggregations
  if (s.includes('totaldonationsamount') && s.includes('from donations')) {
    const totalAmount = memoryStore.donations.reduce((acc, d) => acc + (parseFloat(d.amount) || 0), 0);
    const totalZakat = memoryStore.donations.filter(d => ['zakat', 'zakath'].includes(d.donation_type)).reduce((acc, d) => acc + (parseFloat(d.amount) || 0), 0);
    const totalSadaqah = memoryStore.donations.filter(d => d.donation_type === 'sadaqah').reduce((acc, d) => acc + (parseFloat(d.amount) || 0), 0);
    const totalMonthly = memoryStore.donations.filter(d => ['monthly_contribution', 'monthly_donation', 'monthly'].includes(d.donation_type)).reduce((acc, d) => acc + (parseFloat(d.amount) || 0), 0);
    const totalMonthlyCount = memoryStore.donations.filter(d => ['monthly_contribution', 'monthly_donation', 'monthly'].includes(d.donation_type)).length;
    const pendingCount = memoryStore.donations.filter(d => d.status === 'pending').length;
    return [{
      totalDonationsAmount: totalAmount,
      totalDonationsCount: memoryStore.donations.length,
      totalZakat,
      totalSadaqah,
      totalMonthly,
      totalMonthlyCount,
      pendingDonationsCount: pendingCount
    }];
  }

  if (s.includes('totalcauses') && s.includes('from causes')) {
    const totalTarget = memoryStore.causes.reduce((acc, c) => acc + (parseFloat(c.target_amount) || 0), 0);
    const totalRaised = memoryStore.causes.reduce((acc, c) => acc + (parseFloat(c.raised_amount) || 0), 0);
    const activeCauses = memoryStore.causes.filter(c => c.status === 'active').length;
    return [{
      totalCauses: memoryStore.causes.length,
      activeCauses,
      totalTarget,
      totalRaised
    }];
  }

  if (s.includes('totalphotos') && s.includes('from gallery')) {
    return [{ totalPhotos: memoryStore.gallery.length }];
  }

  if (s.includes('totalvolunteers') && s.includes('from volunteers')) {
    const approved = memoryStore.volunteers.filter(v => v.status === 'approved').length;
    const pending = memoryStore.volunteers.filter(v => v.status === 'pending').length;
    return [{
      totalVolunteers: memoryStore.volunteers.length,
      approvedVolunteers: approved,
      pendingVolunteers: pending
    }];
  }

  if (s.includes('totalinquiries') && s.includes('from contact_inquiries')) {
    const unread = memoryStore.contact_inquiries.filter(i => i.status === 'unread').length;
    return [{
      totalInquiries: memoryStore.contact_inquiries.length,
      unreadInquiries: unread
    }];
  }

  if (s.includes('group by donation_type')) {
    const types = ['zakat', 'sadaqah', 'general', 'medical', 'education', 'ration'];
    return types.map(t => {
      const items = memoryStore.donations.filter(d => d.donation_type === t);
      const total = items.reduce((acc, d) => acc + (parseFloat(d.amount) || 0), 0);
      return { donation_type: t, count: items.length, total_amount: total };
    }).filter(t => t.count > 0);
  }

  if (s.includes('date_format(created_at') && s.includes('from donations')) {
    return [
      { month_label: 'Nov 2026', yr: 2026, mo: 11, total_amount: 15500, donation_count: 3 },
      { month_label: 'Oct 2026', yr: 2026, mo: 10, total_amount: 22000, donation_count: 5 },
      { month_label: 'Sep 2026', yr: 2026, mo: 9, total_amount: 18500, donation_count: 4 }
    ];
  }

  // 1. Admins
  if (s.includes('from admins')) {
    if (s.includes('where username = ? or email = ?')) {
      const val = params[0];
      return memoryStore.admins.filter(a => a.username === val || a.email === val);
    }
    if (s.includes('where id = ?')) {
      return memoryStore.admins.filter(a => a.id === parseInt(params[0], 10));
    }
    return memoryStore.admins;
  }

  if (s.startsWith('insert into admins')) {
    const newId = memoryStore.admins.length + 1;
    const newAdmin = {
      id: newId,
      username: params[0],
      email: params[1],
      password: params[2],
      name: params[3],
      role: params[4] || 'admin',
      created_at: new Date().toISOString()
    };
    memoryStore.admins.push(newAdmin);
    return { insertId: newId, affectedRows: 1 };
  }

  if (s.startsWith('delete from admins')) {
    const id = parseInt(params[0], 10);
    memoryStore.admins = memoryStore.admins.filter(a => a.id !== id);
    return { affectedRows: 1 };
  }

  // 2. Donations
  if (s.includes('from donations')) {
    if (s.includes('count(*) as total')) {
      return [{ total: memoryStore.donations.length }];
    }
    if (s.includes('where id = ?')) {
      return memoryStore.donations.filter(d => d.id === parseInt(params[0], 10));
    }
    return [...memoryStore.donations].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  if (s.startsWith('insert into donations')) {
    const newId = memoryStore.donations.length + 1;
    const item = {
      id: newId,
      donor_name: params[0],
      donor_email: params[1],
      donor_phone: params[2],
      amount: params[3],
      donation_type: params[4],
      payment_method: params[5],
      transaction_id: params[6],
      status: params[7],
      notes: params[8],
      receipt_number: params[9],
      created_at: new Date().toISOString()
    };
    memoryStore.donations.unshift(item);
    return { insertId: newId, affectedRows: 1 };
  }

  if (s.startsWith('update donations')) {
    const id = parseInt(params[params.length - 1], 10);
    const item = memoryStore.donations.find(d => d.id === id);
    if (item) {
      if (s.includes('set donor_email = ? where id = ?')) {
        item.donor_email = params[0];
      } else {
        item.donor_name = params[0];
        item.donor_email = params[1];
        item.donor_phone = params[2];
        item.amount = params[3];
        item.donation_type = params[4];
        item.payment_method = params[5];
        item.transaction_id = params[6];
        item.status = params[7];
        item.notes = params[8];
      }
    }
    return { affectedRows: 1 };
  }

  if (s.startsWith('delete from donations')) {
    const id = parseInt(params[0], 10);
    memoryStore.donations = memoryStore.donations.filter(d => d.id !== id);
    return { affectedRows: 1 };
  }

  // 3. Causes
  if (s.includes('from causes')) {
    if (s.includes('where id = ?')) {
      return memoryStore.causes.filter(c => c.id === parseInt(params[0], 10));
    }
    return [...memoryStore.causes];
  }

  if (s.startsWith('insert into causes')) {
    const newId = memoryStore.causes.length + 1;
    const item = {
      id: newId,
      title: params[0],
      category: params[1],
      description: params[2],
      target_amount: params[3],
      raised_amount: params[4],
      image_url: params[5],
      status: params[6],
      featured: params[7],
      created_at: new Date().toISOString()
    };
    memoryStore.causes.push(item);
    return { insertId: newId, affectedRows: 1 };
  }

  if (s.startsWith('update causes')) {
    const id = parseInt(params[params.length - 1], 10);
    const item = memoryStore.causes.find(c => c.id === id);
    if (item) {
      item.title = params[0];
      item.category = params[1];
      item.description = params[2];
      item.target_amount = params[3];
      item.raised_amount = params[4];
      item.image_url = params[5];
      item.status = params[6];
      item.featured = params[7];
    }
    return { affectedRows: 1 };
  }

  if (s.startsWith('delete from causes')) {
    const id = parseInt(params[0], 10);
    memoryStore.causes = memoryStore.causes.filter(c => c.id !== id);
    return { affectedRows: 1 };
  }

  // 4. Gallery
  if (s.includes('from gallery')) {
    return [...memoryStore.gallery];
  }

  if (s.startsWith('insert into gallery')) {
    const newId = memoryStore.gallery.length + 1;
    const item = {
      id: newId,
      title: params[0],
      caption: params[1],
      category: params[2],
      image_url: params[3],
      order_num: params[4],
      is_visible: params[5],
      created_at: new Date().toISOString()
    };
    memoryStore.gallery.unshift(item);
    return { insertId: newId, affectedRows: 1 };
  }

  if (s.startsWith('delete from gallery')) {
    const id = parseInt(params[0], 10);
    memoryStore.gallery = memoryStore.gallery.filter(g => g.id !== id);
    return { affectedRows: 1 };
  }

  // 5. Volunteers
  if (s.includes('from volunteers')) {
    return [...memoryStore.volunteers];
  }

  if (s.startsWith('insert into volunteers')) {
    const newId = memoryStore.volunteers.length + 1;
    const item = {
      id: newId,
      name: params[0],
      phone: params[1],
      email: params[2],
      address: params[3],
      occupation: params[4],
      availability: params[5],
      notes: params[6],
      status: params[7],
      created_at: new Date().toISOString()
    };
    memoryStore.volunteers.push(item);
    return { insertId: newId, affectedRows: 1 };
  }

  if (s.startsWith('update volunteers')) {
    const id = parseInt(params[params.length - 1], 10);
    const item = memoryStore.volunteers.find(v => v.id === id);
    if (item) {
      item.status = params[0];
    }
    return { affectedRows: 1 };
  }

  if (s.startsWith('delete from volunteers')) {
    const id = parseInt(params[0], 10);
    memoryStore.volunteers = memoryStore.volunteers.filter(v => v.id !== id);
    return { affectedRows: 1 };
  }

  // 6. Contact Inquiries
  if (s.includes('from contact_inquiries')) {
    return [...memoryStore.contact_inquiries];
  }

  if (s.startsWith('insert into contact_inquiries')) {
    const newId = memoryStore.contact_inquiries.length + 1;
    const item = {
      id: newId,
      name: params[0],
      email: params[1],
      phone: params[2],
      subject: params[3],
      message: params[4],
      status: 'unread',
      created_at: new Date().toISOString()
    };
    memoryStore.contact_inquiries.unshift(item);
    return { insertId: newId, affectedRows: 1 };
  }

  if (s.startsWith('update contact_inquiries')) {
    const id = parseInt(params[params.length - 1], 10);
    const item = memoryStore.contact_inquiries.find(c => c.id === id);
    if (item) {
      item.status = params[0];
    }
    return { affectedRows: 1 };
  }

  if (s.startsWith('delete from contact_inquiries')) {
    const id = parseInt(params[0], 10);
    memoryStore.contact_inquiries = memoryStore.contact_inquiries.filter(c => c.id !== id);
    return { affectedRows: 1 };
  }

  // 7. Trust Settings
  if (s.includes('from trust_settings')) {
    const rows = Object.entries(memoryStore.trust_settings).map(([k, v]) => ({
      setting_key: k,
      setting_value: v
    }));
    return rows;
  }

  if (s.includes('insert into trust_settings')) {
    const key = params[0];
    const val = params[1];
    memoryStore.trust_settings[key] = val;
    return { affectedRows: 1 };
  }

  // 8. Activity Logs
  if (s.includes('from activity_logs')) {
    return [...memoryStore.activity_logs];
  }

  if (s.startsWith('insert into activity_logs')) {
    const newId = memoryStore.activity_logs.length + 1;
    memoryStore.activity_logs.unshift({
      id: newId,
      admin_id: params[0],
      admin_name: params[1],
      action: params[2],
      details: params[3],
      ip_address: params[4] || '127.0.0.1',
      created_at: new Date().toISOString()
    });
    return { insertId: newId, affectedRows: 1 };
  }

  return [];
}

module.exports = {
  getPool,
  query,
  dbConfig,
  isUsingMemoryFallback: () => useMemoryFallback
};
