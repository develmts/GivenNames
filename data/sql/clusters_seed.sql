-- clusters_seed.sql
-- Initial insertion of semantic clusters for GivenNames V4

INSERT INTO Clusters (cluster_id, label, description) VALUES
(1, 'Virtues', 'Names based on traditional moral virtues such as Hope, Faith, Charity, Prudence, Justice.'),
(2, 'Flowers and plants', 'Names derived from flowers or plants, including Japanese floral names such as Rosa, Lily, Sakura, Ayame.'),
(3, 'Gemstones', 'Names inspired by gemstones such as Ruby, Emerald, Pearl, Jade.'),
(4, 'Colors', 'Names corresponding to colors, e.g. Blanca, Alba, Blue, Violet.'),
(5, 'Animals', 'Names inspired by animals such as Leo, Wolf, Dove, Ursula.'),
(6, 'Celestial', 'Names derived from stars, celestial bodies or cosmic concepts such as Estrella, Sol, Luna, Aurora.'),
(7, 'Mythology', 'Names of deities and mythological figures from Greco-Roman, Norse or Celtic traditions such as Apollo, Athena, Thor, Freya, Brigid.'),
(8, 'Biblical and Christian', 'Names from the biblical and Christian tradition, including prophets, apostles and saints: Maria, Joseph, Paul, Francis, Teresa.'),
(9, 'Historic royalty', 'Names of famous kings and queens such as Arthur, Isabel, Alfred, Eleanor.'),
(10, 'Theophoric', 'Names derived from God or containing theophoric elements such as Michael, Theodora, Abdallah.'),
(11, 'Toponyms', 'Names derived from geographical places such as Paris, Rome, Lourdes, Sidney.'),
(12, 'Abstract', 'Modern names based on abstract concepts or ideals such as Destiny, Liberty, Harmony, Serenity, Trinity.'),
(13, 'Literary and cinematic', 'Names created or popularized by literature, movies or TV series such as Wendy, Arya, Khaleesi, Frodo, Leia, Xena.');
