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
                jdbcTemplate.execute("ALTER TABLE IF EXISTS leave_balance ALTER COLUMN total_leaves TYPE DOUBLE PRECISION");
                jdbcTemplate.execute("ALTER TABLE IF EXISTS leave_balance ALTER COLUMN used_leaves TYPE DOUBLE PRECISION");
                jdbcTemplate.execute("ALTER TABLE IF EXISTS leave_balance ALTER COLUMN remaining_leaves TYPE DOUBLE PRECISION");
                
                // Alter leave_requests columns to DOUBLE PRECISION
                jdbcTemplate.execute("ALTER TABLE IF EXISTS leave_requests ALTER COLUMN total_days TYPE DOUBLE PRECISION");
                
                // Add lop_count if missing
                jdbcTemplate.execute("ALTER TABLE IF EXISTS leave_requests ADD COLUMN IF NOT EXISTS lop_count DOUBLE PRECISION DEFAULT 0.0");
                
                log.info("Database schema repair COMPLETED successfully.");
            } catch (Exception e) {
                log.warn("Database schema repair encountered an issue (it might already be fixed): " + e.getMessage());
            }
        };
    }
}
