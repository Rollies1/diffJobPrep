-- R__: Repeatable seed data
-- Re-runs whenever checksum changes. Skips if questions already exist.

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM questions LIMIT 1) THEN
        RETURN;
    END IF;

    INSERT INTO categories (id, name, description) VALUES
        ('550e8400-e29b-41d4-a716-446655440010', 'Software Engineering', 'Core software engineering principles, design patterns, and best practices'),
        ('550e8400-e29b-41d4-a716-446655440011', 'Networking', 'Network protocols, architecture, and troubleshooting'),
        ('550e8400-e29b-41d4-a716-446655440012', 'Cybersecurity', 'Security concepts, threats, and defense mechanisms')
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description;

    INSERT INTO questions (id, category_id, question, sample_answer, difficulty, expected_keywords) VALUES
        ('550e8400-e29b-41d4-a716-446655440100', '550e8400-e29b-41d4-a716-446655440010',
         'Explain the SOLID principles and give an example of each.',
         'Single Responsibility: A class should have one reason to change. Open/Closed: Open for extension, closed for modification. Liskov Substitution: Subtypes must be substitutable for base types. Interface Segregation: Clients should not depend on interfaces they do not use. Dependency Inversion: Depend on abstractions, not concretions.',
         'MEDIUM',
         ARRAY['single responsibility', 'open closed', 'liskov substitution', 'interface segregation', 'dependency inversion']),
        ('550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440010',
         'What is the difference between REST and GraphQL?',
         'REST uses multiple endpoints with fixed data structures. GraphQL uses a single endpoint where clients specify exactly what data they need.',
         'EASY',
         ARRAY['endpoint', 'over-fetching', 'under-fetching', 'schema', 'query']),
        ('550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440010',
         'Describe the CAP theorem and its implications for distributed systems.',
         'In distributed data stores, you can only guarantee two of Consistency, Availability, and Partition Tolerance.',
         'HARD',
         ARRAY['consistency', 'availability', 'partition tolerance', 'distributed', 'cp', 'ap']),
        ('550e8400-e29b-41d4-a716-446655440200', '550e8400-e29b-41d4-a716-446655440011',
         'What happens when you type a URL into your browser?',
         'DNS resolution, TCP handshake, TLS negotiation, HTTP request, server processing, response rendering.',
         'MEDIUM',
         ARRAY['dns', 'tcp', 'tls', 'http', 'rendering']),
        ('550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440011',
         'Explain the difference between TCP and UDP.',
         'TCP is connection-oriented, reliable, ordered delivery with congestion control. UDP is connectionless, unreliable, unordered, but faster.',
         'EASY',
         ARRAY['connection-oriented', 'reliable', 'unordered', 'overhead', 'congestion control']),
        ('550e8400-e29b-41d4-a716-446655440300', '550e8400-e29b-41d4-a716-446655440012',
         'What is the difference between symmetric and asymmetric encryption?',
         'Symmetric uses one key for both encryption and decryption (fast, AES). Asymmetric uses a public/private key pair (slower, RSA/ECC).',
         'MEDIUM',
         ARRAY['symmetric', 'asymmetric', 'public key', 'private key', 'aes', 'rsa']),
        ('550e8400-e29b-41d4-a716-446655440301', '550e8400-e29b-41d4-a716-446655440012',
         'Explain SQL injection and how to prevent it.',
         'SQL injection occurs when untrusted input is concatenated into SQL queries. Prevention: parameterized queries, input validation, ORM frameworks, least privilege.',
         'EASY',
         ARRAY['parameterized queries', 'prepared statements', 'input validation', 'orm', 'least privilege']);
END;
$$;
