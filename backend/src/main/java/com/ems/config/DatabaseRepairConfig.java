package com.ems.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class DatabaseRepairConfig {

        private static final Logger log = LoggerFactory.getLogger(DatabaseRepairConfig.class);

        @Bean
        public CommandLineRunner repairDatabase(JdbcTemplate jdbcTemplate) {
                return args -> {
                        log.info("Starting one-time database schema repair (Integer -> Double Precision)...");
                        try {
                                // Alter leave_balance columns to DOUBLE PRECISION
                                jdbcTemplate
                                                .execute("ALTER TABLE IF EXISTS leave_balance ALTER COLUMN total_leaves TYPE DOUBLE PRECISION");
                                jdbcTemplate
                                                .execute("ALTER TABLE IF EXISTS leave_balance ALTER COLUMN used_leaves TYPE DOUBLE PRECISION");
                                jdbcTemplate.execute(
                                                "ALTER TABLE IF EXISTS leave_balance ALTER COLUMN remaining_leaves TYPE DOUBLE PRECISION");

                                // Alter leave_requests columns to DOUBLE PRECISION
                                jdbcTemplate
                                                .execute("ALTER TABLE IF EXISTS leave_requests ALTER COLUMN total_days TYPE DOUBLE PRECISION");

                                // Add lop_count if missing
                                jdbcTemplate.execute(
                                                "ALTER TABLE IF EXISTS leave_requests ADD COLUMN IF NOT EXISTS lop_count DOUBLE PRECISION DEFAULT 0.0");

                                // Add cancel_reason if missing
                                jdbcTemplate.execute(
                                                "ALTER TABLE IF EXISTS leave_requests ADD COLUMN IF NOT EXISTS cancel_reason TEXT");

                                // Add name column to holidays if missing
                                jdbcTemplate.execute(
                                                "ALTER TABLE IF EXISTS holidays ADD COLUMN IF NOT EXISTS name VARCHAR(255)");

                                // Add break_type column to breaks if missing
                                jdbcTemplate.execute(
                                                "ALTER TABLE IF EXISTS breaks ADD COLUMN IF NOT EXISTS break_type VARCHAR(50)");

                                // Asset module tables (ddl-auto is disabled in this project)
                                jdbcTemplate.execute("""
                                                CREATE TABLE IF NOT EXISTS asset_inventory (
                                                        id BIGSERIAL PRIMARY KEY,
                                                        asset_code VARCHAR(100) NOT NULL UNIQUE,
                                                        computer_name VARCHAR(150),
                                                        user_name VARCHAR(150),
                                                        department VARCHAR(150),
                                                        email_id VARCHAR(150),
                                                        mobile_number VARCHAR(30),
                                                        ip_address VARCHAR(50),
                                                        make VARCHAR(100),
                                                        model VARCHAR(150),
                                                        cpu VARCHAR(200),
                                                        ram VARCHAR(50),
                                                        hdd_and_type VARCHAR(120),
                                                        os VARCHAR(100),
                                                        status VARCHAR(30),
                                                        remarks TEXT,
                                                        maintenance VARCHAR(50),
                                                        asset_type VARCHAR(30),
                                                        created_at TIMESTAMP,
                                                        updated_at TIMESTAMP
                                                )
                                                """);

                                jdbcTemplate.execute("""
                                                CREATE TABLE IF NOT EXISTS category_assets (
                                                        id BIGSERIAL PRIMARY KEY,
                                                        asset_class VARCHAR(100),
                                                        product_name VARCHAR(150),
                                                        asset_code VARCHAR(100) NOT NULL UNIQUE,
                                                        location VARCHAR(150),
                                                        department VARCHAR(150),
                                                        responsibility VARCHAR(150),
                                                        make VARCHAR(100),
                                                        model VARCHAR(150),
                                                        description TEXT,
                                                        status VARCHAR(30),
                                                        last_maintenance VARCHAR(50),
                                                        additional_support TEXT,
                                                        remarks TEXT,
                                                        created_at TIMESTAMP,
                                                        updated_at TIMESTAMP
                                                )
                                                """);

                                jdbcTemplate.execute("""
                                                CREATE TABLE IF NOT EXISTS stock_items (
                                                        id BIGSERIAL PRIMARY KEY,
                                                        section_name VARCHAR(100),
                                                        item_name VARCHAR(150) NOT NULL,
                                                        specification VARCHAR(200),
                                                        brand VARCHAR(100),
                                                        quantity INTEGER NOT NULL DEFAULT 0,
                                                        status VARCHAR(30),
                                                        remarks TEXT,
                                                        created_at TIMESTAMP,
                                                        updated_at TIMESTAMP
                                                )
                                                """);

                                jdbcTemplate.execute("""
                                                CREATE TABLE IF NOT EXISTS maintenance_schedules (
                                                        id BIGSERIAL PRIMARY KEY,
                                                        asset_name VARCHAR(150) NOT NULL,
                                                        asset_code VARCHAR(100) NOT NULL,
                                                        location VARCHAR(200),
                                                        created_at TIMESTAMP,
                                                        updated_at TIMESTAMP
                                                )
                                                """);

                                jdbcTemplate.execute("""
                                                CREATE TABLE IF NOT EXISTS maintenance_schedule_entries (
                                                        id BIGSERIAL PRIMARY KEY,
                                                        schedule_id BIGINT NOT NULL,
                                                        year VARCHAR(10) NOT NULL,
                                                        month_range VARCHAR(50) NOT NULL,
                                                        planned_date VARCHAR(100),
                                                        actual_date VARCHAR(50),
                                                        status VARCHAR(150),
                                                        CONSTRAINT fk_maintenance_schedule_entries_schedule
                                                                FOREIGN KEY (schedule_id)
                                                                REFERENCES maintenance_schedules(id)
                                                                ON DELETE CASCADE
                                                )
                                                """);

                                jdbcTemplate.execute("""
                                                CREATE TABLE IF NOT EXISTS maintenance_checklists (
                                                        id BIGSERIAL PRIMARY KEY,
                                                        asset_code VARCHAR(100),
                                                        vendor_name VARCHAR(150),
                                                        location VARCHAR(150),
                                                        conducted_date DATE,
                                                        conducted_time TIME,
                                                        overall_comment TEXT,
                                                        previous_service_date DATE,
                                                        next_service_date DATE,
                                                        service_engineer_sign VARCHAR(150),
                                                        office_admin_sign VARCHAR(150),
                                                        created_at TIMESTAMP,
                                                        updated_at TIMESTAMP
                                                )
                                                """);

                                jdbcTemplate.execute("""
                                                CREATE TABLE IF NOT EXISTS maintenance_checklist_items (
                                                        id BIGSERIAL PRIMARY KEY,
                                                        checklist_id BIGINT NOT NULL,
                                                        item_text TEXT NOT NULL,
                                                        response_status VARCHAR(20),
                                                        CONSTRAINT fk_maintenance_checklist_items_checklist
                                                                FOREIGN KEY (checklist_id)
                                                                REFERENCES maintenance_checklists(id)
                                                                ON DELETE CASCADE
                                                )
                                                """);
                                
                                jdbcTemplate.execute("""
                                                CREATE TABLE IF NOT EXISTS dynamic_asset_data (
                                                        tab_id VARCHAR(100) PRIMARY KEY,
                                                        tables_json TEXT,
                                                        rows_json TEXT
                                                )
                                                """);

                                jdbcTemplate.execute("""
                                                CREATE TABLE IF NOT EXISTS asset_logs (
                                                        id BIGSERIAL PRIMARY KEY,
                                                        table_scope VARCHAR(150),
                                                        action VARCHAR(50),
                                                        record_name VARCHAR(255),
                                                        details TEXT,
                                                        record_id BIGINT,
                                                        changes_json TEXT,
                                                        timestamp TIMESTAMP
                                                )
                                                """);

                                log.info("Database schema repair COMPLETED successfully.");
                        } catch (Exception e) {
                                log.warn("Database schema repair encountered an issue (it might already be fixed): "
                                                + e.getMessage());
                        }
                };
        }
}
