import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

public class ScratchTest {
    public static void main(String[] args) {
        try {
            System.out.println("Starting container...");
            PostgreSQLContainer<?> pg = new PostgreSQLContainer<>(DockerImageName.parse("postgres:15-alpine").asCompatibleSubstituteFor("postgres"))
                .withDatabaseName("testdb")
                .withUsername("test")
                .withPassword("test");
            pg.start();
            System.out.println("Container started! JDBC URL: " + pg.getJdbcUrl());
            pg.stop();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
