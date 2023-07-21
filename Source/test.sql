-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 20, 2023 at 10:24 PM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `test`
--

-- --------------------------------------------------------

--
-- Table structure for table `buyer_requests`
--

CREATE TABLE `buyer_requests` (
  `id` int(11) NOT NULL,
  `land_id` varchar(255) NOT NULL,
  `seller_cnic` varchar(255) NOT NULL,
  `buyer_cnic` varchar(255) NOT NULL,
  `status` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `buyer_requests`
--

INSERT INTO `buyer_requests` (`id`, `land_id`, `seller_cnic`, `buyer_cnic`, `status`) VALUES
(13, 'KHT40', '1234567891234', '1430163991547', 2);

-- --------------------------------------------------------

--
-- Table structure for table `land_inspector`
--

CREATE TABLE `land_inspector` (
  `id` int(11) NOT NULL,
  `land_id` varchar(255) NOT NULL,
  `seller_cnic` varchar(255) NOT NULL,
  `buyer_cnic` varchar(255) NOT NULL,
  `status` int(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `land_inspector`
--

INSERT INTO `land_inspector` (`id`, `land_id`, `seller_cnic`, `buyer_cnic`, `status`) VALUES
(11, 'KHT40', '1234567891234', '1430163991547', 2);

-- --------------------------------------------------------

--
-- Table structure for table `land_record`
--

CREATE TABLE `land_record` (
  `id` int(11) NOT NULL,
  `user_cnic` varchar(255) NOT NULL,
  `district` varchar(255) NOT NULL,
  `tehsil` varchar(255) NOT NULL,
  `mauza` varchar(255) NOT NULL,
  `khatuni` varchar(255) NOT NULL,
  `land_id` varchar(255) NOT NULL,
  `land_size` varchar(255) NOT NULL,
  `land_price` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `land_record`
--

INSERT INTO `land_record` (`id`, `user_cnic`, `district`, `tehsil`, `mauza`, `khatuni`, `land_id`, `land_size`, `land_price`) VALUES
(2, '3650201699371', 'Sanghar', 'Khiproo', 'Khas', '311', 'KHP100', '16000', '1000000'),
(3, '1430163991547', 'Mainwali', 'Isakhel', '320', '715', 'MAL15', '5000', '600000'),
(4, '3230327603633', 'Kohat', 'Gumbat', '112', '302', 'KHT20', '50000', '1000000'),
(5, '1430163991547', 'Kohat', 'Kohat', '735', '312', 'KHT40', '60000', '750000'),
(6, '1430163991547', 'Hyderabad', 'Sanghar', '9800', '2398', 'KAR70', '34000', '980000'),
(7, '3650201699371', 'Sahiwal', 'Harapa', '7838', '9475', 'SAH890', '98090', '3400000'),
(8, '1234567891234', 'Kohat', 'Kohat', '8574', '9547', 'KHT12', '340000', '7600000'),
(9, '3230307981627', 'Multan', 'Khanewal ', '846', '768', 'MUX15', '56900', '2400000');

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `id` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `user_cnic` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `private_key` varchar(255) NOT NULL,
  `email_address` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`id`, `username`, `user_cnic`, `password`, `private_key`, `email_address`) VALUES
(1, 'Jawad', '1430163991547', 'jawad.12345', 'MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgUYnWQkzt8gQ8jaRboYJ1Cx7oKzZUUpqXv+FiAhdzleyhRANCAAQL5HsntnopyoJhm7bLqOX53HjGmWSVJgbwzlvhgZAhpCLB8I3gM5IxQO5boCsecXxr3be2BnDTePxUCYI+RLBF', 'jawad.parshai805@gmail.com'),
(2, 'Anas', '1234567891234', 'anas.12345', 'MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgjUPkD3J7DaxG4XG6AyzUTsBKUo4d8jAz1NT5tdtVhLOhRANCAAR+pR2VEObOd692g3MeCL2TG25WW+06ZMGNXfslPGrLbf9WB1Vu1N4wIfJ7O4EgvCTD25NxP7ysAgz0T5vrlVAb', 'manas2019@namal.edu.pk'),
(3, 'Danish', '3230327603633', 'danish.12345', 'MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgfhJbVGkrOSfvfCOUruuwczJ3m95uvPpuHvwHIPREcqmhRANCAASQKfvQC80/DEouAFCP+HjgpDcEheoJvL51P1gn8sYxgZYrUgxii7lTg6P+w8l1Lbpo+SHM65LMS2nBl7gS/FdS', 'danish2019@namal.edu.pk'),
(4, 'Hammad', '3650201699371', 'hammad.12345', 'MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgLQYJKLKI9ma5BXgx8dkDHL2cJNPXrEVb42XbCk8/dK2hRANCAAR6w1VF+lGpdBPYNl/YxSrfBk9kET1NpB4GetW1RMpsUU3rI9crhlqYU7YWToYX6gR11jztU99LvPxWcP4Iil/B', 'hammad2019@namal.edu.pk'),
(5, 'Patwari', '4321098765432', 'patwari.12345', 'MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgWDjJpn4UVXJbrnZ+dY0bo7c9/mXNP0uVh6oUSkoZvzmhRANCAATXoFJ8qUqPfcgw9pgTE7QJlww9bm0mU3scHkgbpDCqMqs3qTuAb5ZF5qDZcPlNimAF6s0usPiADPfoKXg+jPN9', 'patwari@gmail.com'),
(6, 'abc', '12345', '12345', 'MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgZlAdPBGDTHeSs/a/rm0adSAL///PJr1Y5psT8h0Pu0uhRANCAARl0VWs+gsIjS+dNwyP+IcszaC+oNF5qIagPpObIRDMsoeabE/YiVCMtyJwIPEoKj2pxPKuSL8F9LOY29L9Xh7q', 'abc@gmail.com'),
(7, 'Sharjeel', '3230307981627', 'sharjeel.12345', 'MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgbScNXSkgXL6zdIXw0CNx4X1o1BkpsWdNLl9iXwBerQmhRANCAATe2pkcYIGlXVK3B8eWN8JdxUvMw7XU6nKgUxVtYv9IDo9EAmXJPI4aBWpqOmEt7etWIrhO5dB/lVM5f5jY2bnw', 'sharjeel2019@namal.edu.pk'),
(8, 'Zubair', '3240333340437', 'zubair.12345', 'MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgWSBPfWXM4HmFIhZCS2Hm5FyWRXeXAi8ginAQSzviOOyhRANCAASFxuo7XuC7YmV5J7nYplQ+zmUXSCii7vwomy1HYRzvYDhOybfdIdUmoss54ZtQUjeLgInrpfc46BDCwiRNM/Mw', 'mzubair2019@namal.edu.pk');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `buyer_requests`
--
ALTER TABLE `buyer_requests`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `land_inspector`
--
ALTER TABLE `land_inspector`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `land_record`
--
ALTER TABLE `land_record`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `buyer_requests`
--
ALTER TABLE `buyer_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `land_inspector`
--
ALTER TABLE `land_inspector`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `land_record`
--
ALTER TABLE `land_record`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
