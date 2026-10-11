package app.smarttap.data

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class LocalNetworkTest {
    @Test
    fun privateLanAddressesAreLocal() {
        assertTrue(isLocalNetworkHost("10.0.2.2"))
        assertTrue(isLocalNetworkHost("192.168.1.20"))
        assertTrue(isLocalNetworkHost("172.16.0.1"))
        assertTrue(isLocalNetworkHost("172.31.255.255"))
    }

    @Test
    fun publicHostsAndNamesAreNotLocal() {
        assertFalse(isLocalNetworkHost("172.32.0.1"))
        assertFalse(isLocalNetworkHost("8.8.8.8"))
        assertFalse(isLocalNetworkHost("smart-tap-woad.vercel.app"))
        assertFalse(isLocalNetworkHost("192.168.1"))
        assertFalse(isLocalNetworkHost("192.168.1.300"))
        assertFalse(isLocalNetworkHost(""))
    }
}
