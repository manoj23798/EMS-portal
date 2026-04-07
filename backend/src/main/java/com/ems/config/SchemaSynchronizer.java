package com.ems.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SchemaSynchronizer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        try {
            // Leave Types Schema
            jdbcTemplate.execute("ALTER TABLE leave_types ADD COLUMN IF NOT EXISTS color VARCHAR(255) DEFAULT '#34d399';");
            jdbcTemplate.execute("UPDATE leave_types SET color = '#34d399' WHERE color IS NULL;");
            
            jdbcTemplate.execute("ALTER TABLE leave_types ADD COLUMN IF NOT EXISTS require_approval BOOLEAN DEFAULT true;");
            jdbcTemplate.execute("UPDATE leave_types SET require_approval = true WHERE require_approval IS NULL;");
            
            jdbcTemplate.execute("ALTER TABLE leave_types ADD COLUMN IF NOT EXISTS require_attachment BOOLEAN DEFAULT false;");
            jdbcTemplate.execute("UPDATE leave_types SET require_attachment = false WHERE require_attachment IS NULL;");
            
            jdbcTemplate.execute("ALTER TABLE leave_types ADD COLUMN IF NOT EXISTS is_carry_forward BOOLEAN DEFAULT false;");
            jdbcTemplate.execute("UPDATE leave_types SET is_carry_forward = false WHERE is_carry_forward IS NULL;");
            
            jdbcTemplate.execute("ALTER TABLE leave_types ADD COLUMN IF NOT EXISTS applicable_after_months INTEGER DEFAULT 0;");
            jdbcTemplate.execute("UPDATE leave_types SET applicable_after_months = 0 WHERE applicable_after_months IS NULL;");

            // Holidays Schema
            jdbcTemplate.execute("ALTER TABLE holidays ADD COLUMN IF NOT EXISTS type VARCHAR(255) DEFAULT 'GOVERNMENT';");
            jdbcTemplate.execute("UPDATE holidays SET type = 'GOVERNMENT' WHERE type IS NULL;");
            
            jdbcTemplate.execute("ALTER TABLE holidays ADD COLUMN IF NOT EXISTS color VARCHAR(255) DEFAULT '#ef4444';");
            jdbcTemplate.execute("UPDATE holidays SET color = '#ef4444' WHERE color IS NULL;");

            // Notifications Schema
            jdbcTemplate.execute("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;");
            jdbcTemplate.execute("UPDATE notifications SET is_read = false WHERE is_read IS NULL;");
            
            System.out.println("✅ Schema: Synchronized Core Columns, Notifications, and Patched NULLs.");
        } catch (Exception e) {
            System.err.println("⚠️ Schema Sync Notice: " + e.getMessage());
        }
    }
}
