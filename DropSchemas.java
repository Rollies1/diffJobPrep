import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class DropSchemas {
    public static void main(String[] args) throws Exception {
        String url = "jdbc:postgresql://localhost:5432/jobprep";
        try (Connection conn = DriverManager.getConnection(url, "jobprep", "devpassword");
             Statement stmt = conn.createStatement()) {
            stmt.execute("DROP SCHEMA IF EXISTS practice CASCADE;");
            stmt.execute("DROP SCHEMA IF EXISTS question CASCADE;");
            stmt.execute("DROP SCHEMA IF EXISTS ai CASCADE;");
            System.out.println("Schemas practice, question, and ai dropped.");
        }
    }
}
