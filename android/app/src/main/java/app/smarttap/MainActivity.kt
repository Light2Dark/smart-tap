package app.smarttap

import android.content.pm.ActivityInfo
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import app.smarttap.ui.HomeScreen

class MainActivity : ComponentActivity() {
    private val viewModel: MainViewModel by viewModels { MainViewModel.Factory }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            val state by viewModel.uiState.collectAsStateWithLifecycle()
            val permissionLauncher =
                rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
                    if (granted) {
                        viewModel.refresh()
                    }
                }

            fun askForLocalNetwork() {
                localNetworkPermission?.let(permissionLauncher::launch)
            }
            var askedForLocalNetwork by remember { mutableStateOf(false) }
            LaunchedEffect(state) {
                val signedIn = state as? HomeUiState.SignedIn ?: return@LaunchedEffect
                if (
                    !askedForLocalNetwork &&
                    signedIn.cards is CardsUiState.Failed &&
                    viewModel.needsLocalNetworkConsent()
                ) {
                    askedForLocalNetwork = true
                    askForLocalNetwork()
                }
            }
            val cardOpen = (state as? HomeUiState.SignedIn)?.openCardId != null
            LaunchedEffect(cardOpen) {
                requestedOrientation = walletOrientation(cardOpen)
            }
            MaterialTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    HomeScreen(
                        state = state,
                        onRefresh = {
                            if (viewModel.needsLocalNetworkConsent()) {
                                askForLocalNetwork()
                            } else {
                                viewModel.refresh()
                            }
                        },
                        onOpenCard = viewModel::openCard,
                        onCloseCard = viewModel::closeCard,
                        onShowAdd = viewModel::showAdd,
                        onShowEdit = viewModel::showEdit,
                        onShowList = viewModel::showList,
                        onShowTrash = viewModel::showTrash,
                        onCreateCard = viewModel::createCard,
                        onTrashCard = viewModel::trashCard,
                        onRestoreCard = viewModel::restoreCard,
                        onSaveDestination = viewModel::saveDestination,
                    )
                }
            }
        }
    }

    override fun onStart() {
        super.onStart()
        viewModel.onAppShown()
    }

    override fun onStop() {
        super.onStop()
        if (!isChangingConfigurations) {
            viewModel.onAppHidden()
        }
    }
}

fun walletOrientation(cardOpen: Boolean): Int =
    if (cardOpen) {
        ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE
    } else {
        ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
    }
