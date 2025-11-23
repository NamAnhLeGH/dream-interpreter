import dotenv from 'dotenv';
dotenv.config();

export default {
  datasourceUrl: process.env.DATABASE_URL,
};

